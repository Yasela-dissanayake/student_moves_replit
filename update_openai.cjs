const fs = require('fs');
const path = require('path');

// Read the openai.ts file
const filePath = path.join('server', 'openai.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// List of function names to update
const functionsToUpdate = [
  'generateEmbeddings',
  'analyzeImage',
  'compareFaces',
  'generateText',
  'extractDocumentInfo',
  'analyzeComplianceIssues',
  'verifyIdentity',
  'summarizeDocument',
  'generateImage'
];

// Process each function
let updatedContent = content;
functionsToUpdate.forEach(functionName => {
  // Regex to find the function definition
  const functionRegex = new RegExp(`export async function ${functionName}\\s*\\([^)]*\\).*?{\\s*try\\s*{`, 's');
  
  // Find function in file
  const match = updatedContent.match(functionRegex);
  if (match) {
    // Define the mock implementation check
    let params = '';
    if (functionName === 'generateText') {
      params = 'prompt, maxTokens, forceRefresh';
    } else if (functionName === 'compareFaces') {
      params = 'originalImageBase64, newImageBase64, threshold';
    } else if (functionName === 'verifyIdentity') {
      params = 'documentImageBase64, selfieImageBase64, documentType';
    } else if (functionName === 'analyzeComplianceIssues') {
      params = 'base64Image, documentType';
    } else if (functionName === 'extractDocumentInfo') {
      params = 'base64Image, prompt';
    } else if (functionName === 'analyzeImage') {
      params = 'base64Image, prompt';
    } else if (functionName === 'generateImage') {
      params = 'prompt';
    } else if (functionName === 'summarizeDocument') {
      params = 'base64Image';
    } else {
      params = 'text';
    }
    
    const mockCheck = `// If using mock implementation, use it instead
    if (USE_MOCK_OPENAI) {
      return mockOpenAI.${functionName}(${params});
    }
    
    `;
    
    // Insert mock check after try block and before key check
    const replaced = match[0].replace(/try\s*{/, `try {
    ${mockCheck}`);
    
    // Replace in content
    updatedContent = updatedContent.replace(match[0], replaced);
    console.log(`Updated ${functionName}`);
  } else {
    console.log(`Could not find function ${functionName}`);
  }
});

// Write the updated content back
fs.writeFileSync(filePath, updatedContent, 'utf-8');
console.log('File updated successfully!');
