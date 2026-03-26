// src/routes/historyRoutes.js
const express = require('express')
const router = express.Router()
const { getUserHistory, addHistory } = require('../controllers/historyController')

// Get history for a specific user
router.get('/:userId', getUserHistory)

// Add a history entry
router.post('/', addHistory)

module.exports = router