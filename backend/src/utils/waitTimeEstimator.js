const estimateWaitTime = (position, expectedDuration) => {
  return position * expectedDuration
}

module.exports = { estimateWaitTime }
