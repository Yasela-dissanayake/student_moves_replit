import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  reason?: string;
  faceMatchScore?: number;
  documentValidityScore?: number;
}

export class DocumentVerificationService {
  private static instance: DocumentVerificationService;

  // Singleton pattern
  public static getInstance(): DocumentVerificationService {
    if (!DocumentVerificationService.instance) {
      DocumentVerificationService.instance = new DocumentVerificationService();
    }
    return DocumentVerificationService.instance;
  }

  /**
   * Verify an agent's identity documents using OpenAI
   */
  public async verifyDocuments(agentId: number): Promise<VerificationResult> {
    try {
      // Get the verification record
      const verificationRecord = await db.query(
        'SELECT * FROM agent_verifications WHERE agent_id = $1',
        [agentId]
      );

      if (verificationRecord.rows.length === 0) {
        throw new Error('No verification record found for this agent');
      }

      const record = verificationRecord.rows[0];
      const idDocumentPath = path.join(__dirname, '../../uploads', record.id_document_path);
      const selfiePath = path.join(__dirname, '../../uploads', record.selfie_path);

      // Check if files exist
      if (!fs.existsSync(idDocumentPath) || !fs.existsSync(selfiePath)) {
        throw new Error('Document files not found');
      }

      // Convert images to base64
      const idDocumentBase64 = this.convertToBase64(idDocumentPath);
      const selfieBase64 = this.convertToBase64(selfiePath);

      // Use OpenAI to verify the documents
      const verificationResult = await this.analyzeDocumentsWithAI(idDocumentBase64, selfieBase64);

      // Update the verification status in the database
      await this.updateVerificationStatus(agentId, verificationResult);

      return verificationResult;
    } catch (error) {
      console.error('Error verifying documents:', error);
      return {
        isVerified: false,
        confidence: 0,
        reason: 'Error processing verification: ' + (error as Error).message
      };
    }
  }

  /**
   * Convert file to base64
   */
  private convertToBase64(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(filePath).slice(1);
    const mimeType = fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`;
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  /**
   * Use OpenAI to analyze and verify documents
   */
  private async analyzeDocumentsWithAI(idDocumentBase64: string, selfieBase64: string): Promise<VerificationResult> {
    try {
      // Use the newest OpenAI model gpt-4o which was released May 13, 2024. Do not change this unless explicitly requested by the user.
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an advanced document verification assistant that can analyze ID documents and selfies. Respond with a detailed analysis in JSON format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this ID document and selfie for verification. Check if the document appears valid and if the face in the selfie matches the ID photo. Respond with a JSON object containing: isVerified (boolean), confidence (number 0-1), faceMatchScore (number 0-1), documentValidityScore (number 0-1), and reason (string)."
              },
              {
                type: "image_url",
                image_url: {
                  url: idDocumentBase64
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: selfieBase64
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        isVerified: result.isVerified,
        confidence: result.confidence,
        faceMatchScore: result.faceMatchScore,
        documentValidityScore: result.documentValidityScore,
        reason: result.reason
      };
    } catch (error) {
      console.error('Error analyzing documents with AI:', error);
      return {
        isVerified: false,
        confidence: 0,
        reason: 'AI analysis error: ' + (error as Error).message
      };
    }
  }

  /**
   * Update verification status in the database
   */
  private async updateVerificationStatus(agentId: number, result: VerificationResult): Promise<void> {
    const status = result.isVerified ? 'approved' : 'rejected';
    
    await db.query(
      `UPDATE agent_verifications 
       SET status = $1, 
           verification_confidence = $2,
           face_match_score = $3,
           document_validity_score = $4,
           rejection_reason = $5,
           verified_at = NOW()
       WHERE agent_id = $6`,
      [
        status, 
        result.confidence, 
        result.faceMatchScore || 0,
        result.documentValidityScore || 0,
        !result.isVerified ? result.reason : null,
        agentId
      ]
    );
  }

  /**
   * Process all pending verifications 
   * This would typically be called by a scheduled job
   */
  public async processPendingVerifications(): Promise<number> {
    try {
      // Get all pending verifications
      const pendingVerifications = await db.query(
        "SELECT agent_id FROM agent_verifications WHERE status = 'pending'"
      );

      let processedCount = 0;

      // Process each pending verification
      for (const record of pendingVerifications.rows) {
        await this.verifyDocuments(record.agent_id);
        processedCount++;
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing pending verifications:', error);
      return 0;
    }
  }
}