const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const { sendJobAlerts } = require('../utils/emailService');

// Create a new job posting
router.post('/', auth, async (req, res) => {
  try {
    const { jobTitle, jobDescription, experienceLevel, candidates, endDate } = req.body;
    // console.log(req.body);
    const newJob = new Job({
      company: req.company.id,
      jobTitle,
      jobDescription,
      experienceLevel,
      candidates,
      endDate
    });
    console.log("job created");
    const job = await newJob.save();
    console.log("job saved");
    // Send job alerts to candidates
    await sendJobAlerts(job);
    console.log("job alerts sent");
    res.status(201).json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all job postings for a company
router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.company.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
