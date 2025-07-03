import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { executeAIOperation } from './ai-service-manager';
import { log } from './vite';

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }
  next();
};

const router = Router();

/**
 * Get all job listings
 * Public - no authentication required
 */
router.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    // Extract query parameters for filtering
    const {
      location,
      category,
      type,
      minSalary,
      maxSalary,
      search,
      employerId,
      status
    } = req.query;
    
    // Build filter object from query parameters
    const filters: Record<string, any> = {};
    
    if (location) filters.location = location as string;
    if (category) filters.category = category as string;
    if (type) filters.type = type as string;
    if (employerId) filters.employerId = Number(employerId);
    if (status) filters.status = status as string;
    if (minSalary) filters.minSalary = Number(minSalary);
    if (maxSalary) filters.maxSalary = Number(maxSalary);
    if (search) filters.search = search as string;
    
    // Only get active jobs for public listing
    if (!employerId) {
      filters.status = 'active';
    }
    
    const jobs = await storage.getJobs(filters);
    return res.json(jobs);
  } catch (error) {
    log(`Error getting jobs: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch job listings' });
  }
});

/**
 * Get a specific job listing by ID
 * Public - no authentication required
 */
router.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    const job = await storage.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.json(job);
  } catch (error) {
    log(`Error getting job: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

/**
 * Create a new job listing
 * Authenticated - employer only
 */
router.post('/api/jobs', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Check if user is an employer
    if (req.session.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can create job listings' });
    }
    
    const employerId = req.session.userId;
    const jobData = {
      ...req.body,
      employerId,
      status: 'pending_approval', // New jobs need approval
    };
    
    // Validate job data with zod
    const JobSchema = z.object({
      title: z.string().min(3),
      description: z.string().min(10),
      location: z.string(),
      salary: z.union([
        z.number(),
        z.object({
          min: z.number(),
          max: z.number()
        })
      ]).optional(),
      type: z.string(),
      category: z.string(),
      requiredSkills: z.array(z.string()).optional(),
      preferredSkills: z.array(z.string()).optional(),
      employerId: z.number(),
      status: z.string(),
      workSchedule: z.object({
        totalHoursPerWeek: z.number().optional(),
        preferredDays: z.array(z.string()).optional(),
        preferredTimeOfDay: z.array(z.string()).optional()
      }).optional(),
      applicationDeadline: z.string().optional(),
      startDate: z.string().optional()
    });
    
    const validatedData = JobSchema.parse(jobData);
    
    // Verify job listing with AI
    try {
      const verificationResult = await executeAIOperation('verifyJobListing', {
        job: validatedData
      });
      
      // If AI flags major issues, reject the job creation
      if (!verificationResult.verified) {
        return res.status(400).json({
          error: 'Job listing validation failed',
          issues: verificationResult.issues,
          recommendations: verificationResult.recommendations
        });
      }
      
      // Store AI verification results with the job
      validatedData.aiVerified = true;
      validatedData.aiVerificationResults = verificationResult;
    } catch (aiError) {
      // Continue without AI verification if it fails
      log(`AI verification failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`, 'jobs');
      validatedData.aiVerified = false;
    }
    
    // AI fraud detection
    try {
      const fraudDetectionResult = await executeAIOperation('detectJobFraud', {
        job: validatedData
      });
      
      // If high fraud score detected, flag for review
      if (fraudDetectionResult.fraudDetected) {
        validatedData.flaggedForReview = true;
        validatedData.fraudDetectionResults = fraudDetectionResult;
      }
    } catch (aiError) {
      // Continue without fraud detection if it fails
      log(`AI fraud detection failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`, 'jobs');
    }
    
    // Create the job listing
    const job = await storage.createJob(validatedData);
    return res.status(201).json(job);
  } catch (error) {
    log(`Error creating job: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid job data', details: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to create job listing' });
  }
});

/**
 * Update a job listing
 * Authenticated - must be the employer who created the job
 */
router.patch('/api/jobs/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Get the existing job
    const existingJob = await storage.getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the employer who created the job
    if (req.session.userId !== existingJob.employerId && req.session.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }
    
    // Update the job
    const updatedJob = await storage.updateJob(jobId, req.body);
    return res.json(updatedJob);
  } catch (error) {
    log(`Error updating job: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to update job listing' });
  }
});

/**
 * Delete a job listing
 * Authenticated - must be the employer who created the job or an admin
 */
router.delete('/api/jobs/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Get the existing job
    const existingJob = await storage.getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the employer who created the job or an admin
    if (req.session.userId !== existingJob.employerId && req.session.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }
    
    // Delete the job
    await storage.deleteJob(jobId);
    return res.json({ success: true });
  } catch (error) {
    log(`Error deleting job: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to delete job listing' });
  }
});

/**
 * Get all job applications for an employer's jobs
 * Authenticated - employer only
 */
router.get('/api/employer/applications', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Check if user is an employer
    if (req.session.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can access applications' });
    }
    
    const employerId = req.session.userId;
    const applications = await storage.getEmployerApplications(employerId);
    return res.json(applications);
  } catch (error) {
    log(`Error getting employer applications: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get applications for a specific job
 * Authenticated - must be the employer who created the job
 */
router.get('/api/jobs/:id/applications', authenticateUser, async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Get the job to check ownership
    const job = await storage.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the employer who created the job or an admin
    if (req.session.userId !== job.employerId && req.session.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to access applications for this job' });
    }
    
    // Get applications for this job
    const applications = await storage.getJobApplications(jobId);
    return res.json(applications);
  } catch (error) {
    log(`Error getting job applications: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Apply for a job
 * Authenticated - student only
 */
router.post('/api/jobs/:id/apply', authenticateUser, async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Check if user is a student
    if (req.session.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can apply for jobs' });
    }
    
    const userId = req.session.userId;
    
    // Check if job exists
    const job = await storage.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if already applied
    const existingApplication = await storage.getStudentJobApplication(userId, jobId);
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }
    
    // Create application
    const applicationData = {
      jobId,
      studentId: userId,
      status: 'applied',
      resume: req.body.resume,
      coverLetter: req.body.coverLetter,
      answers: req.body.answers || {}
    };
    
    const application = await storage.createJobApplication(applicationData);
    
    // Get student profile for AI matching
    const studentProfile = await storage.getStudentProfile(userId);
    
    // Use AI to analyze application fit
    try {
      const analysisResult = await executeAIOperation('analyzeStudentResume', {
        studentProfile: {
          ...studentProfile,
          resume: applicationData.resume
        }
      });
      
      // Save analysis results
      await storage.updateJobApplication(application.id, {
        aiAnalysisResults: analysisResult,
        aiRecommendation: analysisResult.suggestedJobTypes.some(type => 
          job.title.toLowerCase().includes(type.toLowerCase())
        ),
        aiRecommendationScore: analysisResult.suggestedJobTypes.some(type => 
          job.title.toLowerCase().includes(type.toLowerCase())
        ) ? 85 : 50,
        aiRecommendationReason: `Based on skills and experience analysis. ${analysisResult.strengthAreas.join(', ')}`
      });
    } catch (aiError) {
      log(`AI resume analysis failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`, 'jobs');
    }
    
    return res.status(201).json(application);
  } catch (error) {
    log(`Error applying for job: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to submit job application' });
  }
});

/**
 * Update application status
 * Authenticated - must be the employer who created the job
 */
router.patch('/api/applications/:id/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const applicationId = Number(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    // Validate status
    const { status } = req.body;
    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'interview_scheduled', 'offered', 'accepted', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Get the application
    const application = await storage.getJobApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get the job to check ownership
    const job = await storage.getJobById(application.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Associated job not found' });
    }
    
    // Check if user is the employer who created the job or an admin
    if (req.session.userId !== job.employerId && req.session.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }
    
    // Update application status
    const updatedApplication = await storage.updateJobApplication(applicationId, { status });
    return res.json(updatedApplication);
  } catch (error) {
    log(`Error updating application status: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to update application status' });
  }
});

/**
 * Schedule an interview for an application
 * Authenticated - must be the employer who created the job
 */
router.post('/api/applications/:id/interview', authenticateUser, async (req: Request, res: Response) => {
  try {
    const applicationId = Number(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    // Get the application
    const application = await storage.getJobApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get the job to check ownership
    const job = await storage.getJobById(application.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Associated job not found' });
    }
    
    // Check if user is the employer who created the job
    if (req.session.userId !== job.employerId && req.session.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to schedule an interview for this application' });
    }
    
    // Validate interview data
    const interviewSchema = z.object({
      date: z.string(),
      time: z.string(),
      duration: z.number().min(15).max(180),
      type: z.enum(['in_person', 'video', 'phone']),
      location: z.string().optional(),
      notes: z.string().optional()
    });
    
    const validatedData = interviewSchema.parse(req.body);
    
    // Create the interview
    const interviewData = {
      applicationId,
      date: validatedData.date,
      time: validatedData.time,
      duration: validatedData.duration,
      type: validatedData.type,
      location: validatedData.location,
      notes: validatedData.notes,
      status: 'scheduled'
    };
    
    const interview = await storage.createJobInterview(interviewData);
    
    // Update application status
    await storage.updateJobApplication(applicationId, { status: 'interview_scheduled' });
    
    return res.status(201).json(interview);
  } catch (error) {
    log(`Error scheduling interview: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid interview data', details: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

/**
 * Get student's job applications
 * Authenticated - student only sees their own applications
 */
router.get('/api/student/applications', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Check if user is a student
    if (req.session.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can access their applications' });
    }
    
    const studentId = req.session.userId;
    const applications = await storage.getStudentApplications(studentId);
    return res.json(applications);
  } catch (error) {
    log(`Error getting student applications: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get recommended jobs for a student
 * Authenticated - student only
 */
router.get('/api/student/recommended-jobs', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Check if user is a student
    if (req.session.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can access job recommendations' });
    }
    
    const studentId = req.session.userId;
    
    // Get student profile
    const studentProfile = await storage.getStudentProfile(studentId);
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get active jobs
    const jobs = await storage.getJobs({ status: 'active' });
    
    // Use AI to match student to jobs
    try {
      const matchResult = await executeAIOperation('matchStudentToJobs', {
        studentProfile,
        availableJobs: jobs
      });
      
      // Sort jobs by compatibility
      const matchedJobs = matchResult.matches.map(match => {
        const job = jobs.find(j => j.id === match.jobId);
        return {
          ...job,
          compatibility: match.compatibility,
          matchReasons: match.matchReasons,
          mismatchReasons: match.mismatchReasons
        };
      });
      
      return res.json({
        jobs: matchedJobs,
        recommendedSkills: matchResult.recommendedSkillsToAcquire,
        suggestedSearchTerms: matchResult.suggestedSearchTerms
      });
    } catch (aiError) {
      log(`AI job matching failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`, 'jobs');
      
      // Fallback to basic recommendations if AI fails
      return res.json({
        jobs: jobs.slice(0, 5),
        recommendedSkills: [],
        suggestedSearchTerms: []
      });
    }
  } catch (error) {
    log(`Error getting recommended jobs: ${error instanceof Error ? error.message : String(error)}`, 'jobs');
    return res.status(500).json({ error: 'Failed to fetch job recommendations' });
  }
});

export default router;