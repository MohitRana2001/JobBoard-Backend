const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, subject, templateName, context) => {
    const templatePath = path.join(__dirname, `../emailTemplates/${templateName}.hbs`);
    const emailTemplate = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(emailTemplate);
    const html = compiledTemplate(context);
    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html : html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendJobAlerts = async (subject, templateName, context, job) => {
    const templatePath = path.join(__dirname, `../emailTemplates/${templateName}.hbs`);
    const emailTemplate = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(emailTemplate);
    const html = compiledTemplate(context);
    const mailOptions = {
    from: process.env.EMAIL_USER,
    subject: subject,
    html : html,
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
