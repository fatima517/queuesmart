jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('../src/models/notificationModel', () => ({
  create: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  markAsViewed: jest.fn(),
  deleteById: jest.fn()
}))
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

const request = require('supertest')
const app = require('../server')
const Notification = require('../src/models/notificationModel')

const mockNotification = {
  notification_id: 1,
  user_id: 1,
  message: 'You joined the queue for General Consultation.',
  timestamp: new Date().toISOString(),
  status: 'sent'
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/notifications/:userId', () => {
  test('should return all notifications for a user', async () => {
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, [mockNotification]))

    const res = await request(app).get('/api/notifications/1')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })

  test('should return only notifications for the specified user', async () => {
    const user2Notif = { ...mockNotification, notification_id: 2, user_id: 2 }
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, id === 2 ? [user2Notif] : [mockNotification]))

    const res = await request(app).get('/api/notifications/2')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].user_id).toBe(2)
  })

  test('should return empty array if user has no notifications', async () => {
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).get('/api/notifications/999')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  test('should return notification objects with expected fields', async () => {
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, [mockNotification]))

    const res = await request(app).get('/api/notifications/1')
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('notification_id')
    expect(res.body[0]).toHaveProperty('user_id')
    expect(res.body[0]).toHaveProperty('message')
    expect(res.body[0]).toHaveProperty('status')
  })
})

describe('PUT /api/notifications/:id/read', () => {
  test('should mark a notification as read', async () => {
    Notification.getById.mockImplementation((id, cb) => cb(null, [mockNotification]))
    Notification.markAsViewed.mockImplementation((id, cb) => cb(null))

    const res = await request(app).put('/api/notifications/1/read')
    expect(res.status).toBe(200)
    expect(res.body.notification.status).toBe('viewed')
  })

  test('should return the updated notification', async () => {
    Notification.getById.mockImplementation((id, cb) => cb(null, [mockNotification]))
    Notification.markAsViewed.mockImplementation((id, cb) => cb(null))

    const res = await request(app).put('/api/notifications/1/read')
    expect(res.status).toBe(200)
    expect(res.body.notification.notification_id).toBe(1)
    expect(res.body.message).toBe('Notification marked as read')
  })

  test('should fail if notification does not exist', async () => {
    Notification.getById.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).put('/api/notifications/999/read')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Notification not found')
  })

  test('should call markAsViewed with the correct id', async () => {
    Notification.getById.mockImplementation((id, cb) => cb(null, [mockNotification]))
    Notification.markAsViewed.mockImplementation((id, cb) => cb(null))

    await request(app).put('/api/notifications/1/read')
    expect(Notification.markAsViewed).toHaveBeenCalledWith(1, expect.any(Function))
  })
})
