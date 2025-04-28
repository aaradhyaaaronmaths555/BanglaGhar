const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiry: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Otp", otpSchema);