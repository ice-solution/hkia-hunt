const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

staffSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

staffSchema.statics.hashPassword = async function hashPassword(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Staff', staffSchema);
