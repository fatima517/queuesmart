const db = require('../config/db')
const QueueEntry = require('../models/queueEntryModel')
const Queue = require('../models/queueModel')
const Service = require('../models/serviceModel')
const Notification = require('../models/notificationModel')
const { estimateWaitTime } = require('../utils/waitTimeEstimator')

const joinQueue = (req, res) => {
  const { user_id, service_id } = req.body

  if (!user_id || !service_id) {
    return res.status(400).json({ message: 'user_id and service_id are required' })
  }
  if (typeof user_id !== 'number' && isNaN(parseInt(user_id))) {
    return res.status(400).json({ message: 'user_id must be a number' })
  }
  if (typeof service_id !== 'number' && isNaN(parseInt(service_id))) {
    return res.status(400).json({ message: 'service_id must be a number' })
  }

  const uid = parseInt(user_id)
  const sid = parseInt(service_id)

  Service.getById(sid, (err, serviceResults) => {
    if (err) return res.status(500).json({ message: 'Error joining queue' })
    if (serviceResults.length === 0) return res.status(404).json({ message: 'Service not found' })

    const service = serviceResults[0]

    Queue.getByServiceId(sid, (err, queueResults) => {
      if (err) return res.status(500).json({ message: 'Error joining queue' })

      const openQueue = queueResults.find(q => q.status === 'open')
      if (!openQueue) return res.status(404).json({ message: 'No open queue for this service' })

      const queue_id = openQueue.queue_id

      QueueEntry.getQueueEntries(queue_id, (err, entries) => {
        if (err) return res.status(500).json({ message: 'Error joining queue' })

        const alreadyWaiting = entries.find(e => e.user_id === uid && e.status === 'waiting')
        if (alreadyWaiting) return res.status(409).json({ message: 'User is already in this queue' })

        const waitingEntries = entries.filter(e => e.status === 'waiting')
        if (waitingEntries.length >= openQueue.max_size) {
          return res.status(409).json({ message: 'Queue is full' })
        }

        const position = waitingEntries.length + 1
        const waitTime = estimateWaitTime(position, service.expected_duration)

        QueueEntry.joinQueue(queue_id, uid, position, (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'User is already in this queue' })
            return res.status(500).json({ message: 'Error joining queue' })
          }

          const entry_id = result.insertId
          const message = `You joined the queue for ${service.service_name}. Your position: #${position}. Estimated wait: ${waitTime} minutes.`

          Notification.create(uid, message, () => {})

          res.status(201).json({
            message: 'Joined queue',
            queueEntry: { entry_id, queue_id, user_id: uid, service_id: sid, position, waitTime, status: 'waiting' }
          })
        })
      })
    })
  })
}

const getQueueStatus = (req, res) => {
  const user_id = parseInt(req.params.userId)
  if (isNaN(user_id)) return res.status(400).json({ message: 'userId is required' })

  QueueEntry.getByUserId(user_id, (err, entries) => {
    if (err) return res.status(500).json({ message: 'Error fetching queue status' })

    const waitingEntry = entries.find(e => e.status === 'waiting')
    if (!waitingEntry) return res.status(404).json({ message: 'User is not in any queue' })

    const { queue_id } = waitingEntry

    QueueEntry.getQueueEntries(queue_id, (err, allEntries) => {
      if (err) return res.status(500).json({ message: 'Error fetching queue status' })

      const waitingEntries = allEntries.filter(e => e.status === 'waiting')
      const position = waitingEntries.findIndex(e => e.user_id === user_id) + 1

      Queue.getById(queue_id, (err, queueResults) => {
        if (err) return res.status(500).json({ message: 'Error fetching queue status' })
        if (queueResults.length === 0) return res.status(404).json({ message: 'Queue not found' })

        const queue = queueResults[0]

        Service.getById(queue.service_id, (err, serviceResults) => {
          if (err) return res.status(500).json({ message: 'Error fetching queue status' })
          if (serviceResults.length === 0) return res.status(404).json({ message: 'Service not found' })

          const service = serviceResults[0]
          const waitTime = estimateWaitTime(position, service.expected_duration)

          if (position <= 2) {
            Notification.getByUserId(user_id, (err, notifications) => {
              if (!err) {
                const hasAlmost = notifications.some(n => n.message.includes('almost up'))
                if (!hasAlmost) {
                  const msg = `You are almost up! Only ${position} person(s) ahead of you for ${service.service_name}.`
                  Notification.create(user_id, msg, () => {})
                }
              }
            })
          }

          res.status(200).json({
            queueEntry: { ...waitingEntry, position, waitTime },
            position,
            waitTime,
            serviceName: service.service_name
          })
        })
      })
    })
  })
}

const leaveQueue = (req, res) => {
  const user_id = parseInt(req.params.userId)
  if (isNaN(user_id)) return res.status(400).json({ message: 'userId is required' })

  QueueEntry.getByUserId(user_id, (err, entries) => {
    if (err) return res.status(500).json({ message: 'Error leaving queue' })

    const waitingEntry = entries.find(e => e.status === 'waiting')
    if (!waitingEntry) return res.status(404).json({ message: 'User is not in any queue' })

    QueueEntry.updateStatus(waitingEntry.entry_id, 'canceled', (err) => {
      if (err) return res.status(500).json({ message: 'Error leaving queue' })
      res.status(200).json({ message: 'Left queue successfully' })
    })
  })
}

const getQueue = (req, res) => {
  const query = `
    SELECT qe.entry_id, qe.queue_id, qe.user_id, qe.position, qe.join_time, qe.status,
           s.service_id, s.service_name, s.expected_duration, s.priority_level
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.queue_id
    JOIN services s ON q.service_id = s.service_id
    WHERE qe.status = 'waiting'
    ORDER BY qe.queue_id ASC, qe.position ASC
  `
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching queue' })
    res.status(200).json(results)
  })
}

const serveNext = (req, res) => {
  const query = `
    SELECT qe.entry_id, qe.queue_id, qe.user_id, qe.position,
           q.service_id
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.queue_id
    WHERE qe.status = 'waiting'
    ORDER BY qe.queue_id ASC, qe.position ASC
    LIMIT 1
  `
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error serving next in queue' })
    if (results.length === 0) return res.status(404).json({ message: 'No one in queue' })

    const next = results[0]

    QueueEntry.updateStatus(next.entry_id, 'served', (err) => {
      if (err) return res.status(500).json({ message: 'Error serving next in queue' })

      Service.getById(next.service_id, (err, serviceResults) => {
        const serviceName = (!err && serviceResults.length > 0)
          ? serviceResults[0].service_name
          : 'the service counter'

        const message = `It's your turn! Please proceed to ${serviceName}.`
        Notification.create(next.user_id, message, () => {})

        res.status(200).json({ message: 'Served next in queue', served: next })
      })
    })
  })
}

module.exports = { joinQueue, getQueueStatus, leaveQueue, getQueue, serveNext }
