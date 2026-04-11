const Notification = require('../models/notificationModel')

const getUserNotifications = (req, res) => {
  const user_id = parseInt(req.params.userId)
  if (isNaN(user_id)) return res.status(400).json({ message: 'userId is required' })

  Notification.getByUserId(user_id, (err, notifications) => {
    if (err) return res.status(500).json({ message: 'Error fetching notifications' })
    res.status(200).json(notifications)
  })
}

const markAsRead = (req, res) => {
  const notification_id = parseInt(req.params.id)
  if (isNaN(notification_id)) return res.status(400).json({ message: 'Notification id is required' })

  Notification.getById(notification_id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error updating notification' })
    if (results.length === 0) return res.status(404).json({ message: 'Notification not found' })

    Notification.markAsViewed(notification_id, (err) => {
      if (err) return res.status(500).json({ message: 'Error updating notification' })
      res.status(200).json({ message: 'Notification marked as read', notification: { ...results[0], status: 'viewed' } })
    })
  })
}

module.exports = { getUserNotifications, markAsRead }
