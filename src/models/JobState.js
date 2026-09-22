const mongoose = require('mongoose');

const jobStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    lastScheduledResetDate: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobState', jobStateSchema);
