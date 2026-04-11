const express = require('express')
const router = express.Router()
const { getUserHistory, addHistory } = require('../controllers/historyController')

router.get('/:userId', getUserHistory)
router.post('/', addHistory)

module.exports = router
