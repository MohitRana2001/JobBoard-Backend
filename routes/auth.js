const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Company = require('../models/Company'); // Assuming the company model is in models folder
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/emailService');
const { sendVerificationSMS } = require('../utils/smsService');

dotenv.config();

const router = express.Router();

// Register a new company
router.post('/register', async (req, res) => {
  try {
    const { name, phone, companyName, companyEmail, employeeSize, password } = req.body;

    // Check if company already exists
    let company = await Company.findOne({ companyEmail });
    if (company) {
      return res.status(400).json({ msg: 'Company already exists' });
    }

    // Create new company
    company = new Company({
      name,
      phone,
      companyName,
      companyEmail,
      employeeSize,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    company.password = await bcrypt.hash(password, salt);

    // Generate OTP for email and phone verification
    const emailOtp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const phoneOtp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Store OTPs in the company object
    company.emailOtp = emailOtp;
    company.mobileOtp = phoneOtp;

    await company.save();

    // Send OTP via email and SMS
    sendVerificationEmail(company.companyEmail, emailOtp);
    sendVerificationSMS(company.phone, phoneOtp);

    const token = jwt.sign({ company: { id: company._id, companyEmail: company.companyEmail } }, process.env.JWT_SECRET);

    res.status(201).json({
      msg: 'Company registered successfully. Please verify your email and phone.',
      token,
      companyDetails: {
        id: company._id,
        name: company.name,
        companyName: company.companyName,
        companyEmail: company.companyEmail
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { companyEmail, otp } = req.body;

    const company = await Company.findOne({ companyEmail });
    if (!company) {
      return res.status(400).json({ msg: 'Company not found' });
    }

    // Check OTP
    if (company.emailOtp != otp) {
      return res.status(400).json({ msg: `Invalid OTP ${company.emailOtp} ${otp}` });
    }

    console.log(company.emailOtp);
    console.log(otp);

    // Mark email as verified
    company.isEmailVerified = true;
    company.emailOtp = null; // clear OTP once verified
    await company.save();

    res.json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify mobile
router.post('/verify-mobile', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const company = await Company.findOne({ phone });
    if (!company) {
      return res.status(400).json({ msg: 'Company not found' });
    }

    console.log(company.mobileOtp);
    console.log(otp);
    // Check OTP
    if (company.mobileOtp != parseInt(otp)) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }


    // Mark phone as verified
    company.isMobileVerified = true;
    company.mobileOtp = null; // clear OTP once verified
    await company.save();

    res.json({ msg: 'Mobile verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/company', async(req,res)=>{
  try {
    const company = await Company.find();
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify token
router.get('/verify-token', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.company.id).select('-password');
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
