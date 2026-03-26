// src/controllers/historyController.js
const store = require('../data/store')

// Get history for a specific user
const getUserHistory = (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    const userHistory = store.history.filter(h => h.userId === userId)

    if (userHistory.length === 0) {
      return res.status(404).json({ message: 'No history found for this user' })
    }

    res.status(200).json(userHistory)

  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' })
  }
}

// Add a history entry
const addHistory = (req, res) => {
  try {
    const { userId, serviceId, waitTime } = req.body

    // Validation
    if (!userId || !serviceId || !waitTime) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    if (typeof waitTime !== 'number') {
      return res.status(400).json({ message: 'Wait time must be a number' })
    }

    const user = store.users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const service = store.services.find(s => s.id === serviceId)
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const newHistory = {
      id: String(store.history.length + 1),
      userId,
      serviceId,
      servedAt: new Date(),
      waitTime
    }

    store.history.push(newHistory)
    res.status(201).json({ message: 'History added', history: newHistory })

  } catch (error) {
    res.status(500).json({ message: 'Error adding history' })
  }
}

module.exports = { getUserHistory, addHistory }