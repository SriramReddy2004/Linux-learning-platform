const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container',
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  commandsExecuted: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1 });

// Calculate session duration on end
sessionSchema.methods.endSession = function() {
  this.endedAt = new Date();
  this.isActive = false;
  this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);
