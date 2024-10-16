const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email',
    text: `Your OTP for email verification is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendJobAlerts = async (job) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    subject: `New Job Opportunity: ${job.jobTitle}`,
    text: `A new job matching your profile has been posted:\n\nTitle: ${job.jobTitle}\nDescription: ${job.jobDescription}\nExperience Level: ${job.experienceLevel}\n\nApply now!`,
  };

  for (const candidate of job.candidates) {
    mailOptions.to = candidate;
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Job alert sent to ${candidate}`);
    } catch (error) {
      console.error(`Error sending job alert to ${candidate}:`, error);
    }
  }
};

module.exports = {
  sendVerificationEmail,
  sendJobAlerts,
};
