// tests/history.test.js
const request = require('supertest')
const app = require('../server')
const store = require('../src/data/store')

beforeEach(() => {
  // Reset history and users before each test
  store.history = [
    {
      id: 'h1',
      userId: '1',
      serviceId: '1',
      servedAt: new Date('2024-01-01T10:30:00'),
      waitTime: 10
    }
  ]
  store.users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    }
  ]
  store.services = [
    {
      id: '1',
      name: 'General Consultation',
      description: 'General help and support',
      expectedDuration: 10,
      priorityLevel: 'normal'
    }
  ]
})

// Get user history tests
describe('GET /api/history/:userId', () => {
  test('should return history for a valid user', async () => {
    const res = await request(app).get('/api/history/1')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('should return 404 if no history found for user', async () => {
    const res = await request(app).get('/api/history/999')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No history found for this user')
  })
})

// Add history tests
describe('POST /api/history', () => {
  test('should add a new history entry', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({
        userId: '1',
        serviceId: '1',
        waitTime: 15
      })
    expect(res.status).toBe(201)
    expect(res.body.history.userId).toBe('1')
  })

  test('should fail if fields are missing', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({ userId: '1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if waitTime is not a number', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({
        userId: '1',
        serviceId: '1',
        waitTime: 'ten'
      })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Wait time must be a number')
  })

  test('should fail if user does not exist', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({
        userId: '999',
        serviceId: '1',
        waitTime: 10
      })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User not found')
  })

  test('should fail if service does not exist', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({
        userId: '1',
        serviceId: '999',
        waitTime: 10
      })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Service not found')
  })
})