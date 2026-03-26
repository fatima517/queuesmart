// tests/service.test.js
const request = require('supertest')
const app = require('../server')
const store = require('../src/data/store')

beforeEach(() => {
  // Reset services before each test
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

// List services tests
describe('GET /api/services', () => {
  test('should return all services', async () => {
    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })
})

// Create service tests
describe('POST /api/services', () => {
  test('should create a new service', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'New Service',
        description: 'A new service',
        expectedDuration: 15,
        priorityLevel: 'normal'
      })
    expect(res.status).toBe(201)
    expect(res.body.service.name).toBe('New Service')
  })

  test('should fail if fields are missing', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Incomplete Service' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if name is over 50 characters', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'A'.repeat(51),
        description: 'A service',
        expectedDuration: 10,
        priorityLevel: 'normal'
      })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be under 50 characters')
  })

  test('should fail if description is over 200 characters', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'Valid Name',
        description: 'A'.repeat(201),
        expectedDuration: 10,
        priorityLevel: 'normal'
      })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Description must be under 200 characters')
  })

  test('should fail if expectedDuration is not a number', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'Valid Name',
        description: 'A service',
        expectedDuration: 'ten',
        priorityLevel: 'normal'
      })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Expected duration must be a number')
  })
})

// Update service tests
describe('PUT /api/services/:id', () => {
  test('should update an existing service', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ name: 'Updated Service' })
    expect(res.status).toBe(200)
    expect(res.body.service.name).toBe('Updated Service')
  })

  test('should fail if service is not found', async () => {
    const res = await request(app)
      .put('/api/services/999')
      .send({ name: 'Updated Service' })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Service not found')
  })

  test('should fail if name is over 50 characters', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ name: 'A'.repeat(51) })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be under 50 characters')
  })
})