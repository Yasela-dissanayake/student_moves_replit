import { Router } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { namedPersons } from '../shared/schema';
import { z } from 'zod';
import { ensureAuthenticated, ensureAdmin, log, logError } from './utils';

export const namedPersonRouter = Router();

// Add auth debugging middleware specific to named person routes
namedPersonRouter.use((req, res, next) => {
  // Skip all middleware for admin config endpoints
  if (req.path.includes('admin-config')) {
    console.log("Bypassing named person middleware for admin-config:", req.path);
    return next();
  }
  
  console.log("Named Person route accessed:", {
    path: req.path,
    method: req.method,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    userId: req.session?.userId,
    userType: req.session?.userType,
    cookies: req.headers.cookie
  });
  next();
});

// Schema for named person validation
const namedPersonSchema = z.object({
  tenancyId: z.number(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  dateOfBirth: z.string().optional(),
  utilityPreference: z.string().optional(),
  primaryContact: z.boolean().default(true),
});

// Public endpoint for named person data (for the tenant view)
namedPersonRouter.get('/:tenancyId/public', async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    
    if (isNaN(tenancyId)) {
      return res.status(400).json({ error: 'Invalid tenancy ID' });
    }
    
    console.log(`Accessing public named person data for tenancy ID: ${tenancyId}`);
    
    // Create demo data for public/non-authenticated access
    // This simulates the database response for the frontend
    const demoNamedPersons = [
      {
        id: 1,
        tenancyId: tenancyId,
        firstName: "Alex",
        lastName: "Smith",
        email: "alex.smith@example.com",
        phone: "07700900123",
        dateOfBirth: new Date("1995-05-15"),
        utilityPreference: "dual_fuel",
        primaryContact: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    return res.json({ namedPersons: demoNamedPersons });
  } catch (error) {
    console.error('Error fetching named persons (public):', error);
    return res.status(500).json({ error: 'Failed to fetch named persons' });
  }
});

// GET all named persons for a tenancy
namedPersonRouter.get('/:tenancyId', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const tenancyId = parseInt(req.params.tenancyId);
    
    if (isNaN(tenancyId)) {
      return res.status(400).json({ error: 'Invalid tenancy ID' });
    }
    
    const persons = await db.select().from(namedPersons).where(eq(namedPersons.tenancyId, tenancyId));
    
    return res.json({ namedPersons: persons });
  } catch (error) {
    console.error('Error fetching named persons:', error);
    return res.status(500).json({ error: 'Failed to fetch named persons' });
  }
});

// GET a specific named person
namedPersonRouter.get('/person/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid named person ID' });
    }
    
    const person = await db.select().from(namedPersons).where(eq(namedPersons.id, id)).limit(1);
    
    if (!person || person.length === 0) {
      return res.status(404).json({ error: 'Named person not found' });
    }
    
    return res.json({ namedPerson: person[0] });
  } catch (error) {
    console.error('Error fetching named person:', error);
    return res.status(500).json({ error: 'Failed to fetch named person' });
  }
});

// POST create a new named person
namedPersonRouter.post('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const validationResult = namedPersonSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }
    
    const namedPersonData = validationResult.data;
    
    // If this person is set as primary contact, update any existing primary contacts for this tenancy
    if (namedPersonData.primaryContact) {
      await db.update(namedPersons)
        .set({ primaryContact: false })
        .where(eq(namedPersons.tenancyId, namedPersonData.tenancyId));
    }
    
    // Create the new named person
    const result = await db.insert(namedPersons).values({
      tenancyId: namedPersonData.tenancyId,
      firstName: namedPersonData.firstName,
      lastName: namedPersonData.lastName,
      email: namedPersonData.email,
      phone: namedPersonData.phone,
      dateOfBirth: namedPersonData.dateOfBirth ? new Date(namedPersonData.dateOfBirth) : null,
      utilityPreference: namedPersonData.utilityPreference || null,
      primaryContact: namedPersonData.primaryContact,
    }).returning();
    
    return res.status(201).json({ namedPerson: result[0] });
  } catch (error) {
    console.error('Error creating named person:', error);
    return res.status(500).json({ error: 'Failed to create named person' });
  }
});

// PATCH update an existing named person
namedPersonRouter.patch('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid named person ID' });
    }
    
    const validationResult = namedPersonSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() });
    }
    
    const namedPersonData = validationResult.data;
    
    // If this person is set as primary contact, update any existing primary contacts for this tenancy
    if (namedPersonData.primaryContact) {
      await db.update(namedPersons)
        .set({ primaryContact: false })
        .where(eq(namedPersons.tenancyId, namedPersonData.tenancyId));
    }
    
    // Update the named person
    const result = await db.update(namedPersons)
      .set({
        firstName: namedPersonData.firstName,
        lastName: namedPersonData.lastName,
        email: namedPersonData.email,
        phone: namedPersonData.phone,
        dateOfBirth: namedPersonData.dateOfBirth ? new Date(namedPersonData.dateOfBirth) : null,
        utilityPreference: namedPersonData.utilityPreference || null,
        primaryContact: namedPersonData.primaryContact,
      })
      .where(eq(namedPersons.id, id))
      .returning();
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Named person not found' });
    }
    
    return res.json({ namedPerson: result[0] });
  } catch (error) {
    console.error('Error updating named person:', error);
    return res.status(500).json({ error: 'Failed to update named person' });
  }
});

// DELETE a named person
namedPersonRouter.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid named person ID' });
    }
    
    // Check if the person exists before deleting
    const existingPerson = await db.select().from(namedPersons).where(eq(namedPersons.id, id)).limit(1);
    
    if (!existingPerson || existingPerson.length === 0) {
      return res.status(404).json({ error: 'Named person not found' });
    }
    
    // Delete the named person
    await db.delete(namedPersons).where(eq(namedPersons.id, id));
    
    return res.json({ success: true, message: 'Named person deleted successfully' });
  } catch (error) {
    console.error('Error deleting named person:', error);
    return res.status(500).json({ error: 'Failed to delete named person' });
  }
});