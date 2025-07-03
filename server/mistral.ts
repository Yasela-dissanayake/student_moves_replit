/**
 * Mistral AI API Integration
 * This provides integration with the Mistral AI API for various AI functionalities
 */

// Check if the API key is configured
const apiKey = process.env.MISTRAL_API_KEY;
console.log('[mistral]', apiKey ? 'Mistral API key configured' : 'No Mistral API key found');

// Base URL for the Mistral API
const apiUrl = 'https://api.mistral.ai/v1';

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
    throw new Error('Mistral API key is not configured');
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

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'You are a professional real estate copywriter specializing in student accommodation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('[mistral] Error generating property description:', error);
    throw error;
  }
}

/**
 * Generate text for a given prompt
 */
export async function generateText(prompt: string, maxTokens?: number, responseFormat?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Mistral API key is not configured');
  }

  try {
    // Create request body
    const requestBody: any = {
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: 'You are a legal expert specializing in creating professional real estate and rental documents.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: maxTokens || 4000,
    };

    // If JSON format is requested, add it to the system prompt
    if (responseFormat === 'json_object') {
      requestBody.messages[0].content += ' Please provide your response in valid JSON format.';
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Mistral API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('[mistral] Error generating text:', error);
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
    const response = await fetch(`${apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[mistral] Error checking API key:', error);
    return false;
  }
}