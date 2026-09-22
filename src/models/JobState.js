const mongoose = require('mongoose');

const jobStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    /** Last time passwords were reset & emailed (manual or scheduled). */
    lastResetAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobState', jobStateSchema);
