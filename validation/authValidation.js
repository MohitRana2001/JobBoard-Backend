const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyEmail: z.string().email('Invalid email address'),
  employeeSize: z.number().min(1, 'Employee size must be at least 1'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  companyEmail: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const verifyEmailSchema = z.object({
  companyEmail: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 characters'),
});

const verifyMobileSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 characters'),
});

const resetPasswordSchema = z.object({
  companyEmail: z.string().email('Invalid email address'),
  token: z.string().length(6, 'Reset token must be 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyMobileSchema,
  resetPasswordSchema,
};