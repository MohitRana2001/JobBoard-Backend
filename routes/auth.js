const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const { sendVerificationEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpService');
const { registerSchema, loginSchema, verifyEmailSchema, verifyMobileSchema, resetPasswordSchema } = require('../validation/authValidation');

router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, phone, companyName, companyEmail, employeeSize, password } = validatedData;

    let company = await Company.findOne({ companyEmail });
    if (company) {
      return res.status(400).json({ msg: 'Company already exists' });
    }

    company = new Company({
      name,
      phone,
      companyName,
      companyEmail,
      employeeSize,
      password
    });

    const salt = await bcrypt.genSalt(10);
    company.password = await bcrypt.hash(password, salt);

    
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    company.emailOtp = emailOTP;
    company.mobileOtp = mobileOTP;
    
    await company.save();

    console.log(emailOTP, mobileOTP);

    sendVerificationEmail(
      company.companyEmail,
      'Verify Your Email',
      'emailVerification',
      { companyName: company.companyName, otp: emailOTP }
    );
    console.log("email sent");

    // sendSMS(
    //   company.phone,
    //   `Your OTP for Job Board verification is ${mobileOTP}`
    // );
    // console.log("sms sent");

    res.status(201).json({ msg: 'Company registered successfully. Please verify your email and phone.' });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);
    const { companyEmail, otp } = validatedData;
    console.log(companyEmail, otp);
    const company = await Company.findOne({ companyEmail });
    if (!company) {
      return res.status(400).json({ msg: 'Company not found' });
    }

    if (company.emailOtp === otp) {
      company.isEmailVerified = true;
      await company.save();
      res.json({ msg: 'Email verified successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid OTP' });
    }
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify mobile
router.post('/verify-mobile', async (req, res) => {
  try {
    const validatedData = verifyMobileSchema.parse(req.body);
    const { phone, otp } = validatedData;

    const company = await Company.findOne({ phone });
    if (!company) {
      return res.status(400).json({ msg: 'Company not found' });
    }

    if (company.mobileOtp === otp) {
      company.isMobileVerified = true;
      await company.save();
      res.json({ msg: 'Mobile verified successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid OTP' });
    }
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { companyEmail, password } = validatedData;

    let company = await Company.findOne({ companyEmail });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!company.isEmailVerified || !company.isMobileVerified) {
      return res.status(400).json({ msg: 'Please verify your email and phone number' });
    }

    const payload = {
      company: {
        id: company.id
      }
    };

    const token =jwt.sign(
      payload,
      process.env.JWT_SECRET,
    );
    console.log(token);
    console.log(payload);
    res.status(200).json({ msg: 'Login successful' , token});
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Request password reset
router.post('/reset-password-request', async (req, res) => {
  try {
    const { companyEmail } = req.body;
    const company = await Company.findOne({ companyEmail });
    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    const resetToken = generateOTP();
    company.resetPasswordToken = resetToken;
    company.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await company.save();

    await sendEmail(
      company.companyEmail,
      'Password Reset Request',
      'passwordReset',
      { companyName: company.companyName, resetToken }
    );

    res.json({ msg: 'Password reset email sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { companyEmail, token, newPassword } = validatedData;

    const company = await Company.findOne({
      companyEmail,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!company) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    company.password = await bcrypt.hash(newPassword, salt);
    company.resetPasswordToken = undefined;
    company.resetPasswordExpires = undefined;
    await company.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;