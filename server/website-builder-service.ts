/**
 * Website Builder Service
 * 
 * This service handles the core functionality of the website builder including
 * file management, code execution, OpenAI API interactions, and chat functionality.
 * 
 * Security has been enhanced with comprehensive auditing and logging.
 */

import fs from 'fs';
import path from 'path';
import { extractCodeBlocks, extractFilesFromMessage } from './utils/code-extractor';
import { debug, info, warn, error, logSecurity, SecurityContext } from './logging';
import { executeAIOperation } from './ai-service-manager';
import { spawn } from 'child_process';

// Base directory for website projects
const PROJECTS_BASE_DIR = './temp/website-projects';

// Create base directory if it doesn't exist
if (!fs.existsSync(PROJECTS_BASE_DIR)) {
  fs.mkdirSync(PROJECTS_BASE_DIR, { recursive: true });
}

export interface FileInfo {
  path: string;
  content: string;
  language: string;
  isDirectory?: boolean;
}

export interface DirectoryTree {
  name: string;
  path: string;
  isDirectory: boolean;
  children: DirectoryTree[];
  level: number;
}

interface ExecutionResult {
  executionSuccess: boolean;
  output: string;
}

/**
 * Create a new file or update an existing one
 */
export async function createOrUpdateFile(
  filePath: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  try {
    const fullPath = path.join(PROJECTS_BASE_DIR, filePath);
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(fullPath, content);
    
    info(`File created/updated: ${filePath}`, { size: content.length });
    return { success: true, message: `File ${filePath} created/updated successfully` };
  } catch (err) {
    error(`Error creating/updating file: ${filePath}`, { error: err });
    return { 
      success: false, 
      message: `Error creating/updating file: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(
  filePath: string
): Promise<boolean> {
  try {
    const fullPath = path.join(PROJECTS_BASE_DIR, filePath);
    return fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory();
  } catch (err) {
    error(`Error checking if file exists: ${filePath}`, { error: err });
    return false;
  }
}

/**
 * Get file content
 */
export async function getFileContent(
  filePath: string
): Promise<{ success: boolean; content?: string; message?: string; language?: string }> {
  try {
    const fullPath = path.join(PROJECTS_BASE_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return { success: false, message: `File ${filePath} not found` };
    }
    
    if (fs.statSync(fullPath).isDirectory()) {
      return { success: false, message: `${filePath} is a directory` };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const language = getLanguageFromFilename(filePath);
    
    debug(`Retrieved file content: ${filePath}`, { size: content.length });
    return { success: true, content, language };
  } catch (err) {
    error(`Error reading file: ${filePath}`, { error: err });
    return { 
      success: false, 
      message: `Error reading file: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * Execute a code file or code snippet
 */
export async function executeCode(
  code?: string,
  filePath?: string,
  language?: string
): Promise<ExecutionResult> {
  try {
    // Determine language if not provided
    let fileLanguage = language;
    let tempFilePath: string | null = null;
    
    if (filePath) {
      fileLanguage = getLanguageFromFilename(filePath);
      // Use existing file
      const fullPath = path.join(PROJECTS_BASE_DIR, filePath);
      if (!fs.existsSync(fullPath)) {
        return { 
          executionSuccess: false, 
          output: `File ${filePath} not found` 
        };
      }
    } else if (code) {
      // Create temporary file for execution
      const ext = getExtensionForLanguage(fileLanguage || 'js');
      const tempFileName = `temp_exec_${Date.now()}${ext}`;
      tempFilePath = path.join(PROJECTS_BASE_DIR, 'temp', tempFileName);
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(PROJECTS_BASE_DIR, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, code);
      filePath = path.join('temp', tempFileName);
    } else {
      return { 
        executionSuccess: false, 
        output: 'Either code or filePath must be provided' 
      };
    }
    
    // Execute code based on language
    const fullPath = path.join(PROJECTS_BASE_DIR, filePath);
    let command: string;
    let args: string[];
    
    switch (fileLanguage) {
      case 'javascript':
      case 'js':
        command = 'node';
        args = [fullPath];
        break;
      case 'python':
      case 'py':
        command = 'python';
        args = [fullPath];
        break;
      case 'typescript':
      case 'ts':
        command = 'npx';
        args = ['ts-node', fullPath];
        break;
      case 'html':
        return { 
          executionSuccess: true, 
          output: 'HTML files cannot be executed directly. Preview functionality to be implemented.' 
        };
      default:
        return { 
          executionSuccess: false, 
          output: `Unsupported language: ${fileLanguage}` 
        };
    }
    
    // Execute the command
    info(`Executing ${fileLanguage} code`, { command, file: filePath });
    const output = await executeCommand(command, args);
    
    // Clean up temporary file if created
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    return {
      executionSuccess: !output.includes('Error:'),
      output: output
    };
  } catch (err) {
    error(`Error executing code`, { error: err });
    return { 
      executionSuccess: false, 
      output: `Error executing code: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * Get file system tree
 */
export async function getFileSystemTree(basePath: string = ''): Promise<DirectoryTree[]> {
  try {
    const fullPath = path.join(PROJECTS_BASE_DIR, basePath);
    
    // Create base directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    return buildDirectoryTree(fullPath, 0);
  } catch (err) {
    error(`Error getting file system tree`, { error: err });
    return [];
  }
}

/**
 * Build directory tree recursively
 */
function buildDirectoryTree(directoryPath: string, level: number): DirectoryTree[] {
  const result: DirectoryTree[] = [];
  const relativePath = path.relative(PROJECTS_BASE_DIR, directoryPath);
  
  if (level > 5) {
    // Limit recursion depth
    return result;
  }
  
  try {
    const items = fs.readdirSync(directoryPath);
    
    for (const item of items) {
      // Skip hidden files
      if (item.startsWith('.')) continue;
      
      const itemPath = path.join(directoryPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      
      const node: DirectoryTree = {
        name: item,
        path: relativeItemPath,
        isDirectory,
        children: isDirectory ? buildDirectoryTree(itemPath, level + 1) : [],
        level
      };
      
      result.push(node);
    }
    
    // Sort directories first, then files alphabetically
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return result;
  } catch (err) {
    error(`Error building directory tree for ${directoryPath}`, { error: err });
    return [];
  }
}

/**
 * Implement a file from AI chat
 */
export async function implementFile(path: string, code: string, language: string): Promise<{ success: boolean; message: string }> {
  try {
    // Ensure the path has the correct extension
    const ext = getExtensionForLanguage(language);
    const filePath = path.endsWith(ext) ? path : `${path}${ext}`;
    
    // Create or update the file
    const result = await createOrUpdateFile(filePath, code);
    
    info(`Implemented file from AI chat: ${filePath}`, {
      language,
      size: code.length,
      success: result.success
    });
    
    return result;
  } catch (err) {
    error(`Error implementing file from AI chat`, { error: err });
    return {
      success: false,
      message: `Error implementing file: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * Process chat message and generate AI response
 */
export async function processChatMessage(
  messages: { role: string; content: string }[],
  currentFile?: FileInfo,
  securityContext?: SecurityContext
): Promise<{ success: boolean; response?: string; files?: FileInfo[]; message?: string }> {
  try {
    // Provide context about the current file in the system message
    let systemMessage = `You are an expert web developer assistant. You help users build websites and web applications.`;
    
    if (currentFile) {
      systemMessage += `\n\nThe user is currently viewing this file:
      Path: ${currentFile.path}
      Language: ${currentFile.language}
      
      Content:
      \`\`\`${currentFile.language}
      ${currentFile.content}
      \`\`\`
      
      When suggesting changes to this file, include the entire file content with your modifications.
      For other files, you can suggest the content directly.`;
    }
    
    // Add a system message if there isn't one already
    const hasSystemMessage = messages.some(m => m.role === 'system');
    const completeMessages = hasSystemMessage 
      ? messages 
      : [{ role: 'system', content: systemMessage }, ...messages];
    
    // Log the security event with standardized context
    logSecurity('Website builder AI chat initiated', {
      ...securityContext,
      action: 'website_builder_chat',
      result: 'success'
    });
    
    // Enhanced logging with operation details
    const operationDetails = {
      messageCount: messages.length,
      hasCurrentFile: !!currentFile,
      userId: securityContext?.userId,
      userType: securityContext?.userType,
      operation: 'processChatMessage'
    };
    
    // Get response from OpenAI
    info('Processing chat message with AI', operationDetails);
    
    // Call AI service to generate response with security context
    // Convert security context to match the expected format
    const aiSecurityContext = {
      userId: securityContext?.userId,
      userType: securityContext?.userType,
      sessionId: securityContext?.sessionId,
      ipAddress: securityContext?.ipAddress,
      endpoint: securityContext?.endpoint,
      userAgent: securityContext?.userAgent
    };
    
    const response = await executeAIOperation('generateText', {
      prompt: completeMessages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      maxTokens: 2000
    }, 'custom', aiSecurityContext);
    
    if (!response) {
      // Log security failure
      logSecurity('Website builder AI chat failed', {
        ...securityContext,
        action: 'website_builder_chat',
        result: 'failure'
      });
      
      error('Failed to get response from AI service', operationDetails);
      return {
        success: false,
        message: 'Failed to get response from AI service'
      };
    }
    
    // Extract code blocks or file information from the response
    const fileInfo = extractFilesFromMessage(response);
    
    debug('AI response processed', { 
      ...operationDetails,
      responseLength: response.length,
      extractedFiles: fileInfo.length
    });
    
    // Log successful completion with security context
    logSecurity('Website builder AI chat completed', {
      ...securityContext,
      action: 'website_builder_chat',
      result: 'success'
    });
    
    return {
      success: true,
      response,
      files: fileInfo
    };
  } catch (err) {
    // Log security exception
    logSecurity('Website builder AI chat error', {
      ...securityContext,
      action: 'website_builder_chat',
      result: 'failure'
    });
    
    error(`Error processing chat message`, { 
      error: err instanceof Error ? err.message : String(err),
      userId: securityContext?.userId,
      userType: securityContext?.userType
    });
    return {
      success: false,
      message: `Error processing chat: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * Helper function to get file extension for a language
 */
function getExtensionForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return '.js';
    case 'typescript':
    case 'ts':
      return '.ts';
    case 'jsx':
      return '.jsx';
    case 'tsx':
      return '.tsx';
    case 'html':
      return '.html';
    case 'css':
      return '.css';
    case 'python':
    case 'py':
      return '.py';
    case 'json':
      return '.json';
    case 'markdown':
    case 'md':
      return '.md';
    default:
      return `.${language}`;
  }
}

/**
 * Determine the appropriate language based on file extension
 */
function getLanguageFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.js':
      return 'javascript';
    case '.ts':
      return 'typescript';
    case '.jsx':
      return 'jsx';
    case '.tsx':
      return 'tsx';
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.py':
      return 'python';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    default:
      return ext.substring(1) || 'text';
  }
}

/**
 * Execute a command and capture output
 */
async function executeCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        resolve(`Error: Command exited with code ${code}\n${stderr}`);
      } else {
        resolve(stdout || 'Command executed successfully with no output');
      }
    });
    
    process.on('error', (err) => {
      resolve(`Error: ${err.message}`);
    });
  });
}