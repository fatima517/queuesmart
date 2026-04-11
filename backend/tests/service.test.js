jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }))
jest.mock('../src/models/userModel', () => ({
  create: jest.fn(), findByEmail: jest.fn(), getById: jest.fn()
}))
jest.mock('../src/models/profileModel', () => ({
  create: jest.fn(), getByUserId: jest.fn()
}))
jest.mock('../src/models/serviceModel', () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  getByBusinessId: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn()
}))

const request = require('supertest')
const app = require('../server')
const Service = require('../src/models/serviceModel')

const mockService = {
  service_id: 1,
  service_name: 'General Consultation',
  description: 'General help and support',
  expected_duration: 10,
  priority_level: 'medium'
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/services', () => {
  test('should return all services', async () => {
    Service.getAll.mockImplementation((cb) => cb(null, [mockService]))

    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('should return empty array when no services exist', async () => {
    Service.getAll.mockImplementation((cb) => cb(null, []))

    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/services', () => {
  test('should create a new service', async () => {
    Service.create.mockImplementation((bid, name, desc, dur, pri, cb) => cb(null, { insertId: 2 }))

    const res = await request(app).post('/api/services').send({
      name: 'New Service',
      description: 'A new service',
      expectedDuration: 15,
      priorityLevel: 'medium'
    })
    expect(res.status).toBe(201)
    expect(res.body.service.name).toBe('New Service')
  })

  test('should fail if fields are missing', async () => {
    const res = await request(app).post('/api/services').send({ name: 'Incomplete Service' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if name is over 50 characters', async () => {
    const res = await request(app).post('/api/services').send({
      name: 'A'.repeat(51),
      description: 'A service',
      expectedDuration: 10,
      priorityLevel: 'medium'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be under 50 characters')
  })

  test('should fail if description is over 200 characters', async () => {
    const res = await request(app).post('/api/services').send({
      name: 'Valid Name',
      description: 'A'.repeat(201),
      expectedDuration: 10,
      priorityLevel: 'medium'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Description must be under 200 characters')
  })

  test('should fail if expectedDuration is not a number', async () => {
    const res = await request(app).post('/api/services').send({
      name: 'Valid Name',
      description: 'A service',
      expectedDuration: 'ten',
      priorityLevel: 'medium'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Expected duration must be a number')
  })
})

describe('PUT /api/services/:id', () => {
  test('should update an existing service', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Service.updateById.mockImplementation((id, name, desc, dur, pri, cb) => cb(null))

    const res = await request(app).put('/api/services/1').send({ name: 'Updated Service' })
    expect(res.status).toBe(200)
    expect(res.body.service.name).toBe('Updated Service')
  })

  test('should fail if service is not found', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).put('/api/services/999').send({ name: 'Updated Service' })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Service not found')
  })

  test('should fail if name is over 50 characters', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))

    const res = await request(app).put('/api/services/1').send({ name: 'A'.repeat(51) })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be under 50 characters')
  })
})
