const AWS = require("aws-sdk");
const Otp = require("../models/Otp");
const crypto = require("crypto");

// Configure AWS SDK for Cognito
AWS.config.update({
  region: process.env.AWS_REGION,
});

const sendOtp = async (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ error: "Mobile number is required." });
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Save OTP to the database with a 3-minute expiry
  const expiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
  try {
    await Otp.create({ mobileNumber, otp, expiry });

    // Send OTP using AWS SNS
    const sns = new AWS.SNS();
    const params = {
      Message: `Your OTP is ${otp}. It will expire in 3 minutes.`,
      PhoneNumber: mobileNumber,
    };

    await sns.publish(params).promise();

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

const validateOtp = async (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return res.status(400).json({ error: "Mobile number and OTP are required." });
  }

  try {
    // Find the OTP record for the given mobile number
    const otpRecord = await Otp.findOne({ mobileNumber, otp });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP or mobile number." });
    }

    // Check if the OTP has expired
    if (otpRecord.expiry < new Date()) {
      return res.status(400).json({ error: "OTP has expired." });
    }

    // OTP is valid, delete the record to prevent reuse
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "OTP validated successfully." });
  } catch (error) {
    console.error("Error validating OTP:", error);
    res.status(500).json({ error: "Failed to validate OTP." });
  }
};

module.exports = { sendOtp, validateOtp };