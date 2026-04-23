/**
 * SecureVault File Handlers
 * Utilities for file upload, download, and management
 */

/**
 * Read a file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} File contents
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file as Data URL for preview
 * @param {File} file - File to read
 * @returns {Promise<string>} Data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Download a blob to user's device
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Suggested filename
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Icon name for Lucide
 */
export function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Music';
  if (mimeType.includes('pdf')) return 'FileText';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'Archive';
  if (mimeType.includes('doc') || mimeType.includes('word')) return 'FileText';
  if (mimeType.includes('xls') || mimeType.includes('excel') || mimeType.includes('sheet')) return 'Table';
  if (mimeType.includes('ppt') || mimeType.includes('powerpoint')) return 'Presentation';
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'Code';
  return 'File';
}

/**
 * Check if file type can be previewed in browser
 * @param {string} mimeType - MIME type
 * @returns {boolean} Can preview
 */
export function canPreviewInBrowser(mimeType) {
  const previewableTypes = [
    'image/',
    'video/',
    'audio/',
    'text/',
    'application/pdf',
    'application/json'
  ];
  return previewableTypes.some(type => mimeType?.startsWith(type));
}

/**
 * Validate file for upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = null // null = all types
  } = options;
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)}`);
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a shareable link for file
 * @param {string} token - Share token
 * @returns {string} Full share URL
 */
export function createShareableLink(token) {
  return `${window.location.origin}/share/${token}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Generate mailto link for email clients
 * @param {string} provider - Email provider (gmail, outlook, teams, default)
 * @param {Object} params - Email parameters
 * @returns {string} Mailto URL or web mail URL
 */
export function generateEmailLink(provider, params) {
  const { subject = '', body = '', to = '' } = params;
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const encodedTo = encodeURIComponent(to);
  
  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
    
    case 'outlook':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
    
    case 'teams':
      // Teams requires specific app protocol or deep link
      return `https://teams.microsoft.com/l/chat/0/0?users=&message=${encodedBody}`;
    
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
    
    default:
      // Standard mailto
      return `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
  }
}

/**
 * Open email client with pre-filled message
 * @param {string} provider - Email provider
 * @param {Object} params - Email parameters
 */
export function openEmailClient(provider, params) {
  const url = generateEmailLink(provider, params);
  
  if (provider === 'gmail' || provider === 'outlook' || provider === 'teams' || provider === 'yahoo') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // mailto opens native email client
    window.location.href = url;
  }
}

/**
 * Generate a unique guest session ID
 * @returns {string} Session ID
 */
export function generateGuestSessionId() {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Get or create guest session ID
 * @returns {string} Guest session ID
 */
export function getGuestSessionId() {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = generateGuestSessionId();
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
}

/**
 * Clear guest session
 */
export function clearGuestSession() {
  localStorage.removeItem('guestSessionId');
}

/**
 * Sanitize filename for safe download
 * @param {string} filename - Original filename
 * @returns {string} Safe filename
 */
export function sanitizeFilename(filename) {
  // Remove characters that are invalid in filenames
  return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
}
