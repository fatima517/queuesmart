// src/data/store.js
// In-memory data store - no database needed

const store = {

  // Users stored after registration
  users: [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "user"
    },
    {
      id: "2",
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    }
  ],

  // Services that users can queue for
  services: [
    {
      id: "1",
      name: "General Consultation",
      description: "General help and support",
      expectedDuration: 10,
      priorityLevel: "normal"
    },
    {
      id: "2",
      name: "Technical Support",
      description: "Help with technical issues",
      expectedDuration: 20,
      priorityLevel: "high"
    }
  ],

  // Current active queue
  queue: [
    {
      queueId: "q1",
      userId: "1",
      serviceId: "1",
      joinedAt: new Date("2024-01-01T10:00:00"),
      priority: "normal",
      status: "waiting"
    }
  ],

  // Notification log
  notifications: [
    {
      id: "n1",
      userId: "1",
      message: "You have joined the queue",
      timestamp: new Date("2024-01-01T10:00:00")
    }
  ],

  // History of past queue entries
  history: [
    {
      id: "h1",
      userId: "1",
      serviceId: "1",
      servedAt: new Date("2024-01-01T10:30:00"),
      waitTime: 10
    }
  ]

}

module.exports = store