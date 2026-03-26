// src/routes/serviceRoutes.js
const express = require('express')
const router = express.Router()
const { listServices, createService, updateService } = require('../controllers/serviceController')

// List all services - anyone can view
router.get('/', listServices)

// Create a new service - admin only
router.post('/', createService)

// Update a service - admin only
router.put('/:id', updateService)

module.exports = router

