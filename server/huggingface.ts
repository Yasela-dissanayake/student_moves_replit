/**
 * HuggingFace API Integration
 * This provides integration with the HuggingFace API for various AI functionalities
 */

// Check if the API key is configured
const apiKey = process.env.HUGGINGFACE_API_KEY;
const apiUrl = 'https://api-inference.huggingface.co/models';
console.log('[huggingface]', apiKey ? 'HuggingFace API key configured' : 'No HuggingFace API key found');

/**
 * Generate a property description based on provided details
 */
export async function generatePropertyDescription(propertyDetails: {
  title: string;
  location: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  nearbyAmenities?: string[];
}): Promise<string> {
  if (!apiKey) {
    throw new Error('HuggingFace API key is not configured');
  }

  try {
    const prompt = `Generate a professional and appealing property description for a student rental:
      
Property: ${propertyDetails.title}
Location: ${propertyDetails.location}
Type: ${propertyDetails.propertyType}
Bedrooms: ${propertyDetails.bedrooms}
Bathrooms: ${propertyDetails.bathrooms}
Features: ${propertyDetails.features.join(', ')}
${propertyDetails.nearbyAmenities ? `Nearby: ${propertyDetails.nearbyAmenities.join(', ')}` : ''}

The description should highlight the benefits for students, emphasize the location's proximity to universities, 
and create an attractive portrayal of the living space. Keep it under 200 words.`;

    const response = await fetch(`${apiUrl}/mistralai/Mistral-7B-Instruct-v0.2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return cleanResponse(data[0].generated_text || '');
  } catch (error) {
    console.error('[huggingface] Error generating property description:', error);
    throw error;
  }
}

/**
 * Clean up the AI response by removing the prompt and any unwanted artifacts
 */
function cleanResponse(text: string): string {
  // Remove the prompt part if it's included in the response
  const parts = text.split('The description should highlight');
  const response = parts.length > 1 ? parts[1] : text;
  
  // Further clean up by finding the actual description
  const matches = response.match(/([^\n]*(?:\n[^\n]*){1,10})/);
  return matches ? matches[0].trim() : response.trim();
}

/**
 * Generate text for a given prompt
 * @param prompt The prompt to send to the model
 * @param maxTokens Maximum number of tokens to generate
 * @param responseFormat The format for the response (json_object for JSON)
 * @param forceRefresh Whether to force refresh and not use cached results
 * @returns The generated text
 */
export async function generateText(prompt: string, maxTokens?: number, responseFormat?: string, forceRefresh?: boolean): Promise<string> {
  if (!apiKey) {
    throw new Error('HuggingFace API key is not configured');
  }

  try {
    // Modify prompt if JSON response is requested
    let updatedPrompt = prompt;
    if (responseFormat === 'json_object') {
      updatedPrompt = `${prompt}\n\nPlease provide your response in valid JSON format.`;
    }
    
    // Log if this is a force refresh request
    if (forceRefresh) {
      console.log('[huggingface] Force refreshing text generation');
    }
    
    const response = await fetch(`${apiUrl}/mistralai/Mistral-7B-Instruct-v0.2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: updatedPrompt,
        parameters: {
          max_new_tokens: maxTokens || 4000,
          // Use a slightly higher temperature for force refresh to ensure different results
          temperature: forceRefresh ? 0.4 : 0.3,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data[0].generated_text || 'Failed to generate text';
  } catch (error) {
    console.error('[huggingface] Error generating text:', error);
    throw error;
  }
}

/**
 * Check if the API key is valid and the API is responsive
 */
export async function checkApiKey(): Promise<boolean> {
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/gpt2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Hello, world!',
        parameters: {
          max_new_tokens: 5,
        }
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[huggingface] Error checking API key:', error);
    return false;
  }
}