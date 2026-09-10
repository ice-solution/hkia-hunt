const mongoose = require('mongoose');

const gameLogSchema = new mongoose.Schema(
  {
    ref_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    device_id: {
      type: String,
      required: true,
      index: true,
    },
    gamedate: {
      type: String,
      required: true,
      index: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    game_visual_no: {
      type: Number,
      required: true,
    },
    correct: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    incorrect: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    completion_time: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

gameLogSchema.index({ gamedate: 1, device_id: 1 });

module.exports = mongoose.model('GameLog', gameLogSchema);
