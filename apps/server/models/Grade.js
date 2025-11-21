
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    min: 0
  },
  feedback: String,
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// One grade per student per assessment
gradeSchema.index({ assessment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);