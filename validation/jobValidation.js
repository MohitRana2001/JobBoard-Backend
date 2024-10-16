const { z } = require('zod');

const createJobSchema = z.object({
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  experienceLevel: z.enum(['entry', 'mid', 'senior']),
  candidates: z.array(z.string().email('Invalid email address')),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

const updateJobSchema = createJobSchema.partial();

module.exports = {
  createJobSchema,
  updateJobSchema,
};