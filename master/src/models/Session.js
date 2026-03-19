const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
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
  commands: [{
    command: String,
    output: String,
    executedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['active', 'completed', 'interrupted'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);
