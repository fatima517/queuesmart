jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}))
jest.mock('../src/models/userModel', () => ({
  create: jest.fn(),
  findByEmail: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
  deleteById: jest.fn()
}))
jest.mock('../src/models/profileModel', () => ({
  create: jest.fn(),
  getByUserId: jest.fn(),
  updateByUserId: jest.fn(),
  deleteByUserId: jest.fn()
}))

const request = require('supertest')
const app = require('../server')
const bcrypt = require('bcrypt')
const User = require('../src/models/userModel')
const Profile = require('../src/models/profileModel')

const mockUser = { user_id: 1, email: 'john@example.com', password: 'hashed_password', role: 'user' }
const mockProfile = { profile_id: 1, user_id: 1, full_name: 'John Doe', phone: null, preferences: null }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/auth/register', () => {
  test('should register a new user successfully', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, []))
    bcrypt.hash.mockResolvedValue('hashed_password')
    User.create.mockImplementation((email, password, role, cb) => cb(null, { insertId: 1 }))
    Profile.create.mockImplementation((uid, name, phone, prefs, cb) => cb(null))

    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'jane@example.com', password: 'password123'
    })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('jane@example.com')
    expect(res.body.user.role).toBe('user')
    expect(res.body.user.password).toBeUndefined()
  })

  test('should store email in lowercase', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, []))
    bcrypt.hash.mockResolvedValue('hashed_password')
    User.create.mockImplementation((email, password, role, cb) => cb(null, { insertId: 2 }))
    Profile.create.mockImplementation((uid, name, phone, prefs, cb) => cb(null))

    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'JANE@EXAMPLE.COM', password: 'password123'
    })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('jane@example.com')
  })

  test('should fail if all fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jane@example.com', password: 'password123'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if email is already registered', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, [mockUser]))

    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe', email: 'john@example.com', password: 'password123'
    })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Email already registered')
  })

  test('should fail if password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'jane@example.com', password: 'short'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Password must be between 8 and 128 characters')
  })

  test('should fail if password exceeds 128 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'jane@example.com', password: 'A'.repeat(129)
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Password must be between 8 and 128 characters')
  })

  test('should fail if email format is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'not-an-email', password: 'password123'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Invalid email format')
  })

  test('should fail if name is less than 2 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'A', email: 'jane@example.com', password: 'password123'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be between 2 and 100 characters')
  })

  test('should fail if name is over 100 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'A'.repeat(101), email: 'jane@example.com', password: 'password123'
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be between 2 and 100 characters')
  })
})

describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, [mockUser]))
    bcrypt.compare.mockResolvedValue(true)
    Profile.getByUserId.mockImplementation((uid, cb) => cb(null, [mockProfile]))

    const res = await request(app).post('/api/auth/login').send({
      email: 'john@example.com', password: 'password123'
    })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('john@example.com')
    expect(res.body.user.id).toBe(1)
    expect(res.body.user.password).toBeUndefined()
  })

  test('should login case-insensitively on email', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, [mockUser]))
    bcrypt.compare.mockResolvedValue(true)
    Profile.getByUserId.mockImplementation((uid, cb) => cb(null, [mockProfile]))

    const res = await request(app).post('/api/auth/login').send({
      email: 'JOHN@EXAMPLE.COM', password: 'password123'
    })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('john@example.com')
  })

  test('should fail with wrong password', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, [mockUser]))
    bcrypt.compare.mockResolvedValue(false)

    const res = await request(app).post('/api/auth/login').send({
      email: 'john@example.com', password: 'wrongpassword'
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  test('should fail if email does not exist', async () => {
    User.findByEmail.mockImplementation((email, cb) => cb(null, []))

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'password123'
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  test('should fail if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'john@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required')
  })

  test('should fail if email field is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required')
  })
})
