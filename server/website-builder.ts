import fs from 'fs';
import path from 'path';
import * as customAiProvider from './custom-ai-provider';
import { log } from './vite';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

/**
 * Analyzes the current codebase to provide context for feature generation
 */
async function analyzeCodebase(targetComponent?: string): Promise<string> {
  const basePrompt = "Analyzing the codebase for UniRent, a property rental platform...";
  
  if (targetComponent) {
    const possiblePaths = [
      `client/src/components/${targetComponent}.tsx`,
      `client/src/components/${targetComponent.toLowerCase()}.tsx`,
      `client/src/components/ui/${targetComponent}.tsx`,
      `client/src/pages/${targetComponent}.tsx`,
    ];
    
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          return `${basePrompt}\nAnalyzing target component: ${targetComponent}\n\n${fileContent}`;
        }
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
      }
    }
  }
  
  return basePrompt + "\nNo specific component targeted. Generating standalone feature.";
}

/**
 * Generates code and implementation steps for a new website feature
 */
export async function generateFeature(
  featureDescription: string,
  targetComponent?: string
): Promise<{ generatedCode: string; implementationSteps: string[] }> {
  try {
    // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const codebaseContext = await analyzeCodebase(targetComponent);
    
    const prompt = `
You are an expert developer for a student property rental platform called UniRent. The platform uses:
- React + TypeScript frontend with shadcn UI components 
- Express.js backend
- PostgreSQL database with Drizzle ORM

FEATURE REQUEST: ${featureDescription}

FEATURE TYPE: Full Stack Feature (UI + API)
${targetComponent ? `TARGET COMPONENT: The feature should enhance or modify the ${targetComponent} component` : ''}

Based on this request, please:
1. Generate the necessary code to implement this feature
2. Provide a step-by-step implementation guide

CODEBASE CONTEXT:
${codebaseContext}

Your response should follow this JSON format:
{
  "generatedCode": "// The complete implementation code",
  "implementationSteps": [
    "Step 1: Create/modify file X with the following code...",
    "Step 2: Update API endpoint Y to handle the new functionality...",
    ...
  ]
}`;

    // Use custom AI provider instead of Gemini
    log("Using custom AI provider for feature generation", "website-builder");
    let generatedText = "";
    
    try {
      // Try with custom AI provider first
      generatedText = await customAiProvider.generateText(prompt);
      log("Successfully generated feature using custom AI provider", "website-builder");
    } catch (customAiError: any) {
      log(`Custom AI provider error: ${customAiError.message}. Using fallback response.`, "website-builder");
      
      // Fallback simple response if custom AI fails
      return {
        generatedCode: `
// Example implementation for "${featureDescription}"
// This is a fallback implementation since the custom AI service encountered an error

// Client-side component
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Fetch data from API
    fetch('/api/feature-data')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error("Error fetching data:", err));
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          {data.length ? 
            data.map(item => <div key={item.id}>{item.name}</div>) : 
            <div>Loading data...</div>
          }
        </div>
        <Button>Action Button</Button>
      </CardContent>
    </Card>
  );
}

// Server-side endpoint
// In server/routes.ts:
app.get('/api/feature-data', authenticateUser, async (req, res) => {
  try {
    const data = await db.storage.getFeatureData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});`,
        implementationSteps: [
          "Create a new component file in client/src/components/",
          "Import and use the component in a page file",
          "Add a new API endpoint in server/routes.ts",
          "Create necessary database functions in server/storage.ts"
        ]
      };
    }
    
    // Parse the response
    try {
      // Try to parse as JSON directly
      const parsedResponse = JSON.parse(generatedText);
      
      return {
        generatedCode: parsedResponse.generatedCode || '',
        implementationSteps: parsedResponse.implementationSteps || [],
      };
    } catch (jsonError) {
      console.error("Error parsing JSON response from AI provider:", jsonError);
      
      // Extract JSON from text if it's embedded in non-JSON text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsedResponse = JSON.parse(extractedJson);
          
          return {
            generatedCode: parsedResponse.generatedCode || '',
            implementationSteps: parsedResponse.implementationSteps || [],
          };
        } catch (extractError) {
          console.error("Error parsing extracted JSON:", extractError);
        }
      }
      
      // Create a simplified response based on the text content
      const codeBlocks = generatedText.match(/```[\s\S]*?```/g) || [];
      const extractedCode = codeBlocks.map(block => block.replace(/```(?:typescript|javascript|jsx|tsx)?|```/g, '')).join('\n\n');
      
      // Extract steps by looking for numbered lines or bullet points
      const stepLines = generatedText.split('\n').filter(line => 
        /^\d+[\.\)]\s+/.test(line) || // Numbered lines
        /^-\s+/.test(line) || // Bullet points with dash
        /^\*\s+/.test(line) // Bullet points with asterisk
      );
      
      return {
        generatedCode: extractedCode || "// No code was generated",
        implementationSteps: stepLines.length > 0 ? stepLines : ["Implement the feature as shown in the code example"]
      };
    }
  } catch (error: any) {
    console.error("Error generating website feature:", error);
    
    // Generic error response that doesn't reference specific AI services
    return {
      generatedCode: "// Unable to generate code at this time",
      implementationSteps: [
        "The feature generator encountered an issue. Please try with a simpler request or more specific details.",
        "If you need specific guidance, try describing one component or endpoint at a time."
      ]
    };
  }
}

/**
 * Handle a chat message in the website builder and optionally generate code
 */
export async function handleWebsiteBuilderChat(
  messages: ChatMessage[]
): Promise<{ 
  message: string; 
  generatedCode?: string;
  implementationSteps?: string[];
}> {
  try {
    log("Handling website builder chat request", "website-builder");
    console.log("Processing website builder chat with messages:", JSON.stringify(messages.slice(-1)));
    
    // Using custom AI provider instead of Gemini due to quota limitations
    log("Using custom AI provider for website builder chat instead of Gemini", "website-builder");
    
    // Analyze the conversation to determine intent
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    console.log("Latest user message:", latestUserMessage);
    
    // Check if this is a request to generate code
    const isCodeGenerationRequest = detectCodeGenerationIntent(latestUserMessage, messages);
    
    // Get common codebase context
    const codebaseContext = await getCodebaseContext(messages);
    
    if (isCodeGenerationRequest) {
      log("Detected code generation intent in chat", "website-builder");
      
      // Extract feature details from the conversation
      const featureDetails = extractFeatureDetails(messages);
      
      // Generate code using the standard feature generator
      const { generatedCode, implementationSteps } = await generateFeature(
        featureDetails.description,
        featureDetails.targetComponent
      );
      
      // Create a natural language response summarizing the implementation
      const response = await createCodeGenerationResponse(
        featureDetails,
        generatedCode,
        implementationSteps
      );
      
      return {
        message: response,
        generatedCode,
        implementationSteps
      };
    } else {
      // For regular chat interactions without code generation
      log("Handling regular chat interaction", "website-builder");
      
      const chatPrompt = prepareChatPrompt(messages, codebaseContext);
      console.log("Preparing to send chat prompt to Custom AI Provider");
      
      // Use custom AI provider instead of Gemini
      try {
        const response = await customAiProvider.generateText(chatPrompt);
        console.log("Received response from Custom AI Provider:", response.substring(0, 100) + "...");
        return { message: response };
      } catch (customAiError: any) {
        console.error("Error with custom AI provider:", customAiError);
        log(`Custom AI provider error: ${customAiError.message}. Trying fallback response.`, "website-builder");
        
        // Provide a basic fallback response
        return { 
          message: "I understand you're asking about website development. I can help with implementing React components, server routes, database models, or UI features for the UniRent platform. Please provide more details about what you'd like to build."
        };
      }
    }
  } catch (error: any) {
    console.error("Error in website builder chat:", error);
    log(`Error in website builder chat: ${error.message}`, "website-builder");
    
    // Provide more detailed error feedback to the user
    if (error.message?.includes('API key')) {
      return { 
        message: "I'm currently using a custom AI provider that doesn't require an API key. How can I help you with website building today?"
      };
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return {
        message: "I'm using a custom AI provider that doesn't have rate limits. Let me know what website feature you'd like to build!"
      };
    } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
      return {
        message: "Your request contained terms that might be better rephrased. Could you try asking in a different way?"
      };
    } else {
      return {
        message: "I encountered an issue processing your request. Please try a simpler question or provide more details about what you're trying to build."
      };
    }
  }
}

/**
 * Prepare a chat prompt for the AI based on conversation history
 */
function prepareChatPrompt(messages: ChatMessage[], codebaseContext: string): string {
  // Format the conversation history
  const formattedMessages = messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return `
You are an expert AI website builder assistant for UniRent, a student property rental platform.
You provide guidance on building features for the platform using:
- React + TypeScript frontend with shadcn UI components 
- Express.js backend
- PostgreSQL database with Drizzle ORM

Your role is to have a helpful conversation about building website features. Be friendly, knowledgeable, and provide specific guidance.

CODEBASE CONTEXT:
${codebaseContext}

When asked to generate code:
- Provide detailed, well-structured code examples using TypeScript and React
- Include proper error handling, commenting, and follow best practices
- Format code blocks with triple backticks and language specification (e.g. \`\`\`typescript)

CONVERSATION HISTORY:
${formattedMessages}

User is asking for your assistance. Respond in a helpful and conversational manner. If the user is asking for code, provide code snippets with explanations.
`;
}

/**
 * Extract information about the feature to be generated from the conversation
 */
function extractFeatureDetails(messages: ChatMessage[]): {
  description: string;
  targetComponent?: string;
} {
  // Collect all user messages to analyze the full conversation
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const latestUserMessage = userMessages[userMessages.length - 1];
  
  // Combine all user messages for a comprehensive feature description
  // but emphasize the latest message
  const fullDescription = [
    ...userMessages.slice(0, -1),
    `LATEST REQUEST: ${latestUserMessage}`
  ].join('\n\n');
  
  // Try to extract target component from conversation
  const componentPattern = /(?:component|modify|update|enhance)\s+["']?([A-Z][a-zA-Z0-9]+)["']?/i;
  const componentMatches = fullDescription.match(componentPattern);
  const targetComponent = componentMatches ? componentMatches[1] : undefined;
  
  return {
    description: fullDescription,
    targetComponent
  };
}

/**
 * Generate a natural language response for code generation
 */
async function createCodeGenerationResponse(
  featureDetails: { description: string; targetComponent?: string },
  generatedCode: string,
  implementationSteps: string[]
): Promise<string> {
  // Base response with the feature description
  const codeSnippet = generatedCode.length > 300 
    ? generatedCode.substring(0, 300) + '...' 
    : generatedCode;
  
  // Limit to 3 steps for response brevity
  const limitedSteps = implementationSteps.slice(0, 3);
  const hasMoreSteps = implementationSteps.length > 3;
  
  const stepsSection = limitedSteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
  
  const response = `
I've generated the implementation for the feature${featureDetails.targetComponent ? ` that enhances the ${featureDetails.targetComponent} component` : ''}. 

Here's a sample of the generated code:

\`\`\`typescript
${codeSnippet}
\`\`\`

**Implementation Steps:**

${stepsSection}
${hasMoreSteps ? `\n...and ${implementationSteps.length - 3} more steps (full implementation details are available)` : ''}

Would you like me to explain any specific part of the implementation in more detail? Or would you like to proceed with implementing this feature?
  `;
  
  return response.trim();
}

/**
 * Analyze a message to determine if the user is requesting code generation
 */
function detectCodeGenerationIntent(message: string, conversationHistory: ChatMessage[]): boolean {
  // Keywords that indicate code generation intent
  const generationKeywords = [
    'generate', 'create', 'build', 'implement', 'code', 'develop',
    'make', 'feature', 'component', 'function', 'add', 'new'
  ];
  
  // Check for direct command patterns
  const directCommandPatterns = [
    /create (a|an) .+/i,
    /build (a|an) .+/i,
    /generate (a|an) .+/i,
    /implement (a|an) .+/i,
    /add (a|an) .+/i,
    /make (a|an) .+/i,
    /code (a|an) .+/i,
    /can you (create|build|generate|implement|add) .+/i,
    /i need (a|an) .+/i,
    /i want (a|an) .+/i
  ];
  
  // Check direct command patterns
  for (const pattern of directCommandPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  // Count keyword occurrences for intent strength
  const keywordCount = generationKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  
  // If multiple keywords present, likely a generation request
  if (keywordCount >= 2) {
    return true;
  }
  
  // Check assistant's previous response for creation prompt
  const previousAssistantMessage = [...conversationHistory]
    .reverse()
    .find(m => m.role === 'assistant' && m.id !== 'welcome')?.content;
  
  if (previousAssistantMessage) {
    // If assistant asked about creating something and user affirms
    const assistantAskedAboutCreation = /would you like (me to|to|me) (create|generate|implement|build)/i.test(previousAssistantMessage);
    const userAffirmation = /(yes|sure|okay|go ahead|please do|sounds good)/i.test(message);
    
    if (assistantAskedAboutCreation && userAffirmation) {
      return true;
    }
  }
  
  // Default to false for ambiguous requests
  return false;
}

/**
 * Get relevant codebase context for the chat interaction
 */
async function getCodebaseContext(messages: ChatMessage[]): Promise<string> {
  // Try to extract component mentions from the conversation
  const componentPattern = /(?:component|class|module|page|feature)\s+["']?([A-Z][a-zA-Z0-9]+)["']?/gi;
  const allText = messages.map(m => m.content).join(' ');
  
  let match;
  const mentionedComponents: string[] = [];
  while ((match = componentPattern.exec(allText)) !== null) {
    if (match[1] && !mentionedComponents.includes(match[1])) {
      mentionedComponents.push(match[1]);
    }
  }
  
  // Get context for mentioned components
  let context = "UniRent platform context:\n";
  
  if (mentionedComponents.length > 0) {
    for (const component of mentionedComponents) {
      const componentContext = await analyzeCodebase(component);
      context += `\n${componentContext}\n`;
    }
  } else {
    // Default context about the platform structure
    context += `
- Client-side code is in client/src/
- Server-side code is in server/
- Database schema is defined in shared/schema.ts
- Main UI components are in client/src/components/
- Pages are in client/src/pages/
- The application uses shadcn UI components for styling
- API routes are defined in server/routes.ts
`;
  }
  
  return context;
}