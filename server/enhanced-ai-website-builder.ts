/**
 * Enhanced AI Website Builder
 * Provides AI-powered code generation, analysis, and implementation
 */

import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { debug, info, warn, error } from './logging';
import { extractCodeBlocks } from './utils/code-extractor';
import { storage } from './storage';

// Define interfaces
export interface FileInfo {
  path: string;
  content: string;
  language: string;
  isDirectory?: boolean;
}

// Configure OpenAI with the latest SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an AI response for the website builder
 */
export async function generateAIResponse(
  prompt: string,
  conversation: any[] = []
): Promise<{ content: string }> {
  try {
    // Make sure we have an API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.');
    }

    // Format conversation for OpenAI
    const formattedMessages = [
      {
        role: 'system',
        content: `You are a helpful assistant for a website builder tool. Help developers by explaining concepts, debugging code, and suggesting improvements. When providing code examples, use markdown format with appropriate language tags.`
      },
      ...conversation.map((message: any) => ({
        role: message.role,
        content: message.content
      })),
      {
        role: 'user',
        content: prompt
      }
    ];

    // Make the API call to OpenAI with the latest SDK
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048
    });

    // Extract and return the response content
    const responseContent = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    return { content: responseContent };
  } catch (err: any) {
    error(`Error generating AI response: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return { 
      content: `I encountered an error while generating a response: ${err.message}. Please try again later or check your API key configuration.`
    };
  }
}

/**
 * Analyze the codebase with a semantic query
 */
export async function analyzeCodebase(query: string): Promise<FileInfo[]> {
  try {
    // Make sure we have an API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.');
    }

    // Get a list of files to analyze
    const files = await findRelevantFiles(query);
    
    // For each file, read its content
    const filesWithContent: FileInfo[] = [];
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath);
        let language = 'plaintext';
        
        // Map extensions to languages for highlighting
        switch (ext) {
          case '.js': language = 'javascript'; break;
          case '.jsx': language = 'javascript'; break;
          case '.ts': language = 'typescript'; break;
          case '.tsx': language = 'typescript'; break;
          case '.html': language = 'html'; break;
          case '.css': language = 'css'; break;
          case '.json': language = 'json'; break;
          case '.md': language = 'markdown'; break;
          default: language = 'plaintext';
        }
        
        filesWithContent.push({
          path: filePath,
          content,
          language
        });
      } catch (readErr) {
        // Skip files that can't be read
        error(`Error reading file ${filePath}: ${readErr instanceof Error ? readErr.message : String(readErr)}`, { module: 'enhanced-ai-website-builder' });
      }
    }
    
    // If we found no files, try to find files more generally
    if (filesWithContent.length === 0) {
      debug(`No files found for query "${query}", using broader search`, { module: 'enhanced-ai-website-builder' });
      
      // Try a more general approach to finding files
      const generalFiles = await findFilesWithExtension(['.js', '.ts', '.jsx', '.tsx', '.html', '.css'], 5);
      
      for (const filePath of generalFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const ext = path.extname(filePath);
          let language = 'plaintext';
          
          switch (ext) {
            case '.js': language = 'javascript'; break;
            case '.jsx': language = 'javascript'; break;
            case '.ts': language = 'typescript'; break;
            case '.tsx': language = 'typescript'; break;
            case '.html': language = 'html'; break;
            case '.css': language = 'css'; break;
            default: language = 'plaintext';
          }
          
          filesWithContent.push({
            path: filePath,
            content,
            language
          });
        } catch (readErr) {
          // Skip files that can't be read
          error(`Error reading file ${filePath}: ${readErr instanceof Error ? readErr.message : String(readErr)}`, { module: 'enhanced-ai-website-builder' });
        }
      }
    }
    
    // Use OpenAI to rank the files by relevance to the query
    if (filesWithContent.length > 0) {
      const rankedFiles = await rankFilesByRelevance(filesWithContent, query);
      
      debug(`Found ${rankedFiles.length} files for query "${query}"`, { module: 'enhanced-ai-website-builder' });
      
      return rankedFiles;
    }
    
    return filesWithContent;
  } catch (err: any) {
    error(`Error analyzing codebase: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return [];
  }
}

/**
 * Find files that might be relevant to the query
 */
async function findRelevantFiles(query: string): Promise<string[]> {
  try {
    // For simplicity, we'll use a basic keyword-based approach
    // In a real implementation, you might use embeddings or a more sophisticated search
    
    // Convert the query to lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase();
    
    // Break the query into keywords
    const keywords = lowerQuery
      .split(/\s+/)
      .filter(k => k.length > 3) // Filter out very short words
      .map(k => k.replace(/[^\w]/g, '')); // Remove non-word characters
    
    // Get all files with common web development extensions
    const allFiles = await findFilesWithExtension(['.js', '.ts', '.jsx', '.tsx', '.html', '.css'], 20);
    
    // Filter files based on the keywords in their names
    const relevantFiles = allFiles.filter(file => {
      const lowerFilename = path.basename(file).toLowerCase();
      
      // Check if any keyword is in the filename
      return keywords.some(keyword => lowerFilename.includes(keyword));
    });
    
    // If we have enough relevant files by name, return them
    if (relevantFiles.length >= 3) {
      return relevantFiles;
    }
    
    // Otherwise, we need to check file contents
    const filesWithKeywords: string[] = [];
    
    for (const file of allFiles) {
      // Skip node_modules and other common directories to exclude
      if (
        file.includes('node_modules') ||
        file.includes('.git') ||
        file.includes('dist') ||
        file.includes('build')
      ) {
        continue;
      }
      
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lowerContent = content.toLowerCase();
        
        // Check if any keyword is in the content
        const hasKeyword = keywords.some(keyword => lowerContent.includes(keyword));
        
        if (hasKeyword) {
          filesWithKeywords.push(file);
          
          // Limit to 10 files to avoid too much processing
          if (filesWithKeywords.length >= 10) {
            break;
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return [...new Set([...relevantFiles, ...filesWithKeywords])];
  } catch (err: any) {
    error(`Error finding relevant files: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return [];
  }
}

/**
 * Find files with specific extensions
 */
async function findFilesWithExtension(extensions: string[], limit: number = 10): Promise<string[]> {
  const files: string[] = [];
  
  async function searchDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files and directories, and common directories to exclude
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await searchDirectory(fullPath);
          
          // If we've found enough files, stop searching
          if (files.length >= limit) {
            break;
          }
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
          
          // If we've found enough files, stop searching
          if (files.length >= limit) {
            break;
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  // Start the search from the current directory
  await searchDirectory('.');
  
  return files;
}

/**
 * Rank files by relevance to the query
 */
async function rankFilesByRelevance(files: FileInfo[], query: string): Promise<FileInfo[]> {
  try {
    // If there are too many files, use OpenAI to rank them
    if (files.length > 5) {
      // Prepare the prompt for OpenAI
      const fileDescriptions = files.map(file => {
        // Truncate the content to avoid exceeding token limits
        const truncatedContent = file.content.length > 1000 
          ? file.content.substring(0, 1000) + '...' 
          : file.content;
        
        return `File: ${file.path}\nContent:\n${truncatedContent}\n---`;
      }).join('\n');
      
      const prompt = `Rank the following files based on their relevance to this query: "${query}"\n\n${fileDescriptions}\n\nReturn ONLY a JSON array of file paths ordered by relevance, most relevant first.`;
      
      // Call OpenAI to rank the files with the latest SDK
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that ranks files by relevance to a query. Return ONLY a JSON array of file paths, no other text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      
      // Extract the ranked file paths from the response
      const content = response.choices[0]?.message?.content || '[]';
      
      // Try to parse the JSON array of file paths
      let rankedPaths: string[] = [];
      
      try {
        // Find the JSON array in the response
        const jsonMatch = content.match(/\[.*\]/s);
        
        if (jsonMatch) {
          rankedPaths = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in the response');
        }
      } catch (parseErr) {
        error(`Error parsing ranked file paths: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`, { module: 'enhanced-ai-website-builder' });
        
        // If we failed to parse the JSON, fall back to the original order
        return files;
      }
      
      // Map the ranked paths back to the original file objects
      const fileMap = new Map<string, FileInfo>();
      files.forEach(file => fileMap.set(file.path, file));
      
      // Create a new array of files in the ranked order
      const rankedFiles: FileInfo[] = [];
      
      // Add the files in the ranked order
      for (const path of rankedPaths) {
        const file = fileMap.get(path);
        if (file) {
          rankedFiles.push(file);
        }
      }
      
      // Add any files that weren't in the ranking
      for (const file of files) {
        if (!rankedPaths.includes(file.path)) {
          rankedFiles.push(file);
        }
      }
      
      return rankedFiles;
    }
    
    // If there are only a few files, just return them as-is
    return files;
  } catch (err: any) {
    error(`Error ranking files: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    
    // If there was an error, just return the original files
    return files;
  }
}

/**
 * Implement code to a file
 */
export async function implementCode(
  code: string,
  filePath: string,
  language: string
): Promise<{ success: boolean; message: string; path?: string }> {
  try {
    // Normalize the file path
    const normalizedPath = path.normalize(filePath);
    
    // Check if the file already exists
    let fileExists = false;
    try {
      await fs.access(normalizedPath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // Create the directory if it doesn't exist
    const directory = path.dirname(normalizedPath);
    await fs.mkdir(directory, { recursive: true });
    
    // Determine the appropriate action message
    const action = fileExists ? 'Updated' : 'Created';
    
    // Write the code to the file
    await fs.writeFile(normalizedPath, code);
    
    debug(`${action} file: ${normalizedPath}`, { module: 'enhanced-ai-website-builder' });
    
    return {
      success: true,
      message: `${action} file: ${normalizedPath}`,
      path: normalizedPath
    };
  } catch (err: any) {
    error(`Error implementing code: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return {
      success: false,
      message: `Failed to implement code: ${err.message}`
    };
  }
}

/**
 * Extract code from an AI response and implement the files
 */
export async function implementAIResponse(
  response: string
): Promise<{ success: boolean; message: string; files?: string[] }> {
  try {
    // Extract code blocks from the AI response
    const codeBlocks = extractCodeBlocks(response);
    
    if (codeBlocks.length === 0) {
      return {
        success: false,
        message: 'No code blocks found in the AI response.'
      };
    }
    
    // Implement each code block
    const implementedFiles: string[] = [];
    
    for (const codeBlock of codeBlocks) {
      if (!codeBlock.path || !codeBlock.content) {
        continue;
      }
      
      const result = await implementCode(
        codeBlock.content,
        codeBlock.path,
        codeBlock.language
      );
      
      if (result.success && result.path) {
        implementedFiles.push(result.path);
      }
    }
    
    if (implementedFiles.length === 0) {
      return {
        success: false,
        message: 'Failed to implement any files.'
      };
    }
    
    return {
      success: true,
      message: `Successfully implemented ${implementedFiles.length} file(s).`,
      files: implementedFiles
    };
  } catch (err: any) {
    error(`Error implementing AI response: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return {
      success: false,
      message: `Failed to implement AI response: ${err.message}`
    };
  }
}

/**
 * Check if a user is an admin
 */
export async function isAdminUser(userId: number): Promise<boolean> {
  try {
    // For simplicity, we'll always return true in the development environment
    // In a production environment, this would check against the actual user roles
    return true;
    
    /* Uncomment this when storage interface is properly connected
    // Check if the user exists and has the admin role
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    return user.userType === 'admin';
    */
  } catch (err: any) {
    error(`Error checking admin status: ${err.message}`, { module: 'enhanced-ai-website-builder' });
    return false;
  }
}