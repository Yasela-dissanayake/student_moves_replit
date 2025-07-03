// This script generates sample virtual viewing sessions and feedback data

const { storage } = require('../server/storage');

async function generateVirtualViewingData() {
  console.log('Generating sample virtual viewing sessions and feedback...');
  
  try {
    // Generate 10 virtual viewing sessions
    const sessions = await storage.generateSampleVirtualViewingSessions(10);
    console.log(`✅ Successfully generated ${sessions.length} virtual viewing sessions`);
    
    // For sessions without feedback, randomly generate feedback
    const sessionsNeedingFeedback = sessions.filter(
      session => session.status === 'completed' && !session.feedbackRequested
    );
    
    if (sessionsNeedingFeedback.length > 0) {
      console.log(`Generating feedback for ${sessionsNeedingFeedback.length} additional sessions...`);
      
      for (const session of sessionsNeedingFeedback) {
        if (Math.random() > 0.3) { // 70% chance to add feedback
          const feedback = await storage.generateFeedbackForSession(session);
          console.log(`✅ Added ${feedback.length} feedback entries for session ${session.id}`);
        }
      }
    }
    
    // Get some statistics
    for (const session of sessions) {
      const stats = await storage.getPropertyFeedbackStats(session.propertyId);
      if (stats.totalFeedbackCount > 0) {
        console.log(`Property #${session.propertyId} stats:
          - Average rating: ${stats.averageOverallRating.toFixed(1)}/5
          - Feedback count: ${stats.totalFeedbackCount} 
          - Interested in applying: ${stats.interestedInApplyingCount}/${stats.totalFeedbackCount}
        `);
      }
    }
    
    console.log('✅ Sample data generation complete!');
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
}

// Execute the function
generateVirtualViewingData();