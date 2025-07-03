/**
 * Code Extractor Utility
 * 
 * This module provides functions to extract code blocks and file information
 * from AI-generated text for the website builder.
 */

import * as path from 'path';

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  path?: string;
  content?: string;
}

export interface FileInfo {
  path: string;
  content: string;
  language: string;
}

/**
 * Extract code blocks from markdown-formatted text
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlockRegex = /```([a-zA-Z0-9_]+)(?:\s*(.+?\.([a-zA-Z0-9]+))?)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1];
    const filename = match[2]?.trim();
    const extension = match[3] || language;
    const code = match[4];

    blocks.push({
      language,
      code,
      filename,
      path: filename,  // Set path to filename for compatibility with enhanced-ai-website-builder.ts
      content: code    // Set content to code for compatibility with enhanced-ai-website-builder.ts
    });
  }

  return blocks;
}

/**
 * Extract file information from a message
 */
export function extractFilesFromMessage(message: string): FileInfo[] {
  const codeBlocks = extractCodeBlocks(message);
  const files: FileInfo[] = [];

  for (const block of codeBlocks) {
    if (block.path) {  // Use path instead of filename for consistency
      files.push({
        path: block.path,
        content: block.content || block.code,  // Use content with fallback to code
        language: block.language
      });
    }
  }

  return files;
}

/**
 * Determine the appropriate language based on file extension
 */
export function getLanguageFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  
  const extensionMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown'
  };

  return extensionMap[ext] || 'plaintext';
}