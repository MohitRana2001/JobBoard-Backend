const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendVerificationSMS = async (phone, otp) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP for phone verification is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`SMS sent to ${phone}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
};

module.exports = {
  sendVerificationSMS,
};
