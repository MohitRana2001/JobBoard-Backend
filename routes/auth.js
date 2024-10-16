const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const { sendVerificationEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const { generateOTP } = require('../utils/otpService');
const { registerSchema, loginSchema, verifyEmailSchema, verifyMobileSchema } = require('../validation/authValidation');

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

    // if (company.mobileOtp === otp) {
    //   company.isMobileVerified = true;
    //   await company.save();
    //   res.json({ msg: 'Mobile verified successfully' });
    // } else {
    //   res.status(400).json({ msg: 'Invalid OTP' });
    // }
    company.isMobileVerified = true;
    await company.save();
    res.status(200).json({ msg: 'Mobile verified successfully' });
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

module.exports = router;