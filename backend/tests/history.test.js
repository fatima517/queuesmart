jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('../src/models/queueEntryModel', () => ({
  joinQueue: jest.fn(),
  getQueueEntries: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  updateStatus: jest.fn()
}))
jest.mock('../src/models/queueModel', () => ({
  getById: jest.fn(),
  getByServiceId: jest.fn()
}))
jest.mock('../src/models/serviceModel', () => ({
  getById: jest.fn()
}))
jest.mock('../src/models/notificationModel', () => ({
  create: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  markAsViewed: jest.fn()
}))

const request = require('supertest')
const app = require('../server')
const db = require('../src/config/db')
const QueueEntry = require('../src/models/queueEntryModel')

const mockHistoryEntry = {
  entry_id: 1,
  user_id: 1,
  position: 1,
  join_time: new Date().toISOString(),
  status: 'served',
  queue_id: 1,
  service_id: 1,
  service_name: 'General Consultation',
  expected_duration: 10
}

const mockWaitingEntry = {
  entry_id: 2,
  queue_id: 1,
  user_id: 1,
  position: 1,
  join_time: new Date().toISOString(),
  status: 'waiting'
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/history/:userId', () => {
  test('should return history for a valid user', async () => {
    db.query.mockImplementation((query, params, cb) => cb(null, [mockHistoryEntry]))

    const res = await request(app).get('/api/history/1')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('should return 404 if no history found for user', async () => {
    db.query.mockImplementation((query, params, cb) => cb(null, []))

    const res = await request(app).get('/api/history/999')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No history found for this user')
  })

  test('should include service name in history entries', async () => {
    db.query.mockImplementation((query, params, cb) => cb(null, [mockHistoryEntry]))

    const res = await request(app).get('/api/history/1')
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('service_name')
  })

  test('should include both served and canceled entries', async () => {
    const canceledEntry = { ...mockHistoryEntry, entry_id: 3, status: 'canceled' }
    db.query.mockImplementation((query, params, cb) => cb(null, [mockHistoryEntry, canceledEntry]))

    const res = await request(app).get('/api/history/1')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })
})

describe('POST /api/history', () => {
  test('should mark entry as served and return updated entry', async () => {
    QueueEntry.getById.mockImplementation((id, cb) => cb(null, [mockWaitingEntry]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))

    const res = await request(app).post('/api/history').send({ entry_id: 2 })
    expect(res.status).toBe(201)
    expect(res.body.entry.status).toBe('served')
  })

  test('should fail if entry_id is missing', async () => {
    const res = await request(app).post('/api/history').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('entry_id is required')
  })

  test('should fail if queue entry is not found', async () => {
    QueueEntry.getById.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).post('/api/history').send({ entry_id: 999 })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Queue entry not found')
  })

  test('should fail if entry is not in waiting status', async () => {
    const servedEntry = { ...mockWaitingEntry, status: 'served' }
    QueueEntry.getById.mockImplementation((id, cb) => cb(null, [servedEntry]))

    const res = await request(app).post('/api/history').send({ entry_id: 1 })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Entry is not in waiting status')
  })

  test('should call updateStatus with served for the given entry_id', async () => {
    QueueEntry.getById.mockImplementation((id, cb) => cb(null, [mockWaitingEntry]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))

    await request(app).post('/api/history').send({ entry_id: 2 })
    expect(QueueEntry.updateStatus).toHaveBeenCalledWith(2, 'served', expect.any(Function))
  })
})
