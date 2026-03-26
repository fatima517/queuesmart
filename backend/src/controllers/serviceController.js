// src/controllers/serviceController.js
const store = require('../data/store')

// List all services
const listServices = (req, res) => {
  try {
    res.status(200).json(store.services)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' })
  }
}

// Create a new service
const createService = (req, res) => {
  try {
    const { name, description, expectedDuration, priorityLevel } = req.body

    // Validation
    if (!name || !description || !expectedDuration || !priorityLevel) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    if (typeof name !== 'string') {
      return res.status(400).json({ message: 'Name must be a string' })
    }
    if (typeof expectedDuration !== 'number') {
      return res.status(400).json({ message: 'Expected duration must be a number' })
    }
    if (name.length > 50) {
      return res.status(400).json({ message: 'Name must be under 50 characters' })
    }
    if (description.length > 200) {
      return res.status(400).json({ message: 'Description must be under 200 characters' })
    }

    const newService = {
      id: String(store.services.length + 1),
      name,
      description,
      expectedDuration,
      priorityLevel
    }

    store.services.push(newService)
    res.status(201).json({ message: 'Service created', service: newService })

  } catch (error) {
    res.status(500).json({ message: 'Error creating service' })
  }
}

// Update an existing service
const updateService = (req, res) => {
  try {
    const { id } = req.params
    const { name, description, expectedDuration, priorityLevel } = req.body

    const service = store.services.find(s => s.id === id)

    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }

    // Validation
    if (name && name.length > 50) {
      return res.status(400).json({ message: 'Name must be under 50 characters' })
    }
    if (description && description.length > 200) {
      return res.status(400).json({ message: 'Description must be under 200 characters' })
    }
    if (expectedDuration && typeof expectedDuration !== 'number') {
      return res.status(400).json({ message: 'Expected duration must be a number' })
    }

    if (name) service.name = name
    if (description) service.description = description
    if (expectedDuration) service.expectedDuration = expectedDuration
    if (priorityLevel) service.priorityLevel = priorityLevel

    res.status(200).json({ message: 'Service updated', service })

  } catch (error) {
    res.status(500).json({ message: 'Error updating service' })
  }
}

module.exports = { listServices, createService, updateService }