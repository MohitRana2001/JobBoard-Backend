const crypto = require('crypto');

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function storeOTP(userId, otp, type) {
  // In a real application, you'd store this in a database with an expiration time
  // For simplicity, we'll use an in-memory store
  if (!global.otpStore) {
    global.otpStore = {};
  }
  global.otpStore[`${userId}-${type}`] = otp;
}

function verifyOTP(userId, otp, type) {
  const storedOTP = global.otpStore[`${userId}-${type}`];
  if (storedOTP && storedOTP === otp) {
    delete global.otpStore[`${userId}-${type}`];
    return true;
  }
  return false;
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
};