const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    max_timer: {
      type: Number,
      required: true,
      default: 120,
      min: 1,
    },
    answer_timer: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
    },
    circle_radius: {
      type: Number,
      required: true,
      default: 1.5,
    },
  },
  { timestamps: true }
);

gameConfigSchema.statics.getGlobal = async function getGlobal() {
  let config = await this.findOne({ key: 'global' });
  if (!config) {
    config = await this.create({
      key: 'global',
      max_timer: 120,
      answer_timer: 30,
      circle_radius: 1.5,
    });
  }
  return config;
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);
