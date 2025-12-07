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

// Index for efficient queries
containerSchema.index({ userId: 1, status: 1 });
containerSchema.index({ containerId: 1 });

// Update last activity timestamp
containerSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Container', containerSchema);
