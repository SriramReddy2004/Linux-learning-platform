const mongoose = require('mongoose');

const containerSchema = new mongoose.Schema({
  containerId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: String,
    description: 'ID of worker managing this container'
  },
  workerHost: {
    type: String,
    description: 'Hostname or IP of the worker that hosts this container'
  },
  createdOnWorker: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  sshPort: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'running', 'stopped', 'exited', 'error'],
    default: 'created'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  stoppedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  instanceName: {
    type: String,
    required: true,
    description: 'Display name for this instance (user-friendly identifier)'
  },
  resourceUsage: {
    cpuPercent: Number,
    memoryUsage: Number,
    memoryLimit: Number
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Container', containerSchema);
