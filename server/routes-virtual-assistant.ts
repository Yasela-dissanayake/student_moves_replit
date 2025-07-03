import { Express, Request, Response } from "express";
import * as virtualAssistant from "./virtual-assistant";
import { log } from "./vite";
import { authenticateUser } from "./routes";
import z from "zod";

/**
 * Register virtual assistant API routes
 * @param app Express application instance
 */
export function registerVirtualAssistantRoutes(app: Express): void {
  // Input validation schema for assistant queries
  const querySchema = z.object({
    question: z.string().min(2).max(500),
    propertyId: z.number().optional(),
    conversation: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    ).optional()
  });

  // Endpoint to process tenant questions
  app.post("/api/assistant/query", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validation = querySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      const { question, propertyId, conversation } = validation.data;
      const userId = (req as any).user.id;

      log(`Processing assistant query from user ${userId}: ${question.substring(0, 50)}...`, "routes");

      // Process the query using virtual assistant service
      const response = await virtualAssistant.processQuery(
        userId,
        question,
        propertyId,
        conversation
      );

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error processing assistant query:", error);
      return res.status(500).json({
        message: "Failed to process your question. Please try again later."
      });
    }
  });

  // Endpoint to get common questions and answers
  app.get("/api/assistant/faq", async (_req: Request, res: Response) => {
    try {
      const faqs = await virtualAssistant.getCommonQuestions();
      return res.status(200).json(faqs);
    } catch (error) {
      console.error("Error fetching common questions:", error);
      return res.status(500).json({
        message: "Failed to fetch common questions. Please try again later."
      });
    }
  });

  log("Virtual assistant routes registered", "routes");
}