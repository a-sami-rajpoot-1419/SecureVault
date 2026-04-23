/**
 * SecureVault Email Integration
 * Generate mailto links and shareable URLs for various email providers
 */

/**
 * Generate shareable link for a file
 * @param {string} token - Unique share token
 * @returns {string} Full share URL
 */
export function generateShareableLink(token) {
  if (!token) return '';
  return `${window.location.origin}/share/${token}`;
}

/**
 * Generate email content for sharing encrypted file
 * @param {Object} params - Email content parameters
 * @returns {Object} Subject and body for email
 */
export function generateEmailContent(params) {
  const { 
    fileName, 
    shareLink, 
    isEncrypted = true,
    customMessage = ''
  } = params;
  
  const subject = isEncrypted 
    ? `Encrypted file: ${fileName}`
    : `File shared: ${fileName}`;
  
  let body = customMessage ? customMessage + '\n\n' : '';
  body += `I've shared a file with you via SecureVault.\n\n`;
  body += `File: ${fileName}\n`;
  body += `Link: ${shareLink}\n\n`;
  body += isEncrypted 
    ? `This file is encrypted. You'll need the password I shared with you separately to decrypt it.`
    : `Click the link to download the file.`;
  body += `\n\n---\nSent via SecureVault - https://securevault.app`;
  
  return { subject, body };
}

/**
 * Generate Gmail compose URL
 * @param {Object} params - Email parameters
 * @returns {string} Gmail URL
 */
export function generateGmailLink(params) {
  const { to = '', subject = '', body = '' } = params;
  const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
  const query = new URLSearchParams({
    to,
    su: subject,
    body
  }).toString();
  return `${baseUrl}&${query}`;
}

/**
 * Generate Outlook compose URL
 * @param {Object} params - Email parameters
 * @returns {string} Outlook URL
 */
export function generateOutlookLink(params) {
  const { to = '', subject = '', body = '' } = params;
  const baseUrl = 'https://outlook.live.com/mail/0/deeplink/compose';
  const query = new URLSearchParams({
    to,
    subject,
    body
  }).toString();
  return `${baseUrl}?${query}`;
}

/**
 * Generate Yahoo Mail compose URL
 * @param {Object} params - Email parameters
 * @returns {string} Yahoo Mail URL
 */
export function generateYahooLink(params) {
  const { to = '', subject = '', body = '' } = params;
  const baseUrl = 'https://compose.mail.yahoo.com/';
  const query = new URLSearchParams({
    to,
    subject,
    body
  }).toString();
  return `${baseUrl}?${query}`;
}

/**
 * Generate standard mailto link
 * @param {Object} params - Email parameters
 * @returns {string} mailto URL
 */
export function generateMailtoLink(params) {
  const { to = '', subject = '', body = '' } = params;
  const params_ = new URLSearchParams({ subject, body }).toString();
  return `mailto:${to}?${params_}`;
}

/**
 * Share via specific provider
 * @param {string} provider - Email provider name
 * @param {Object} params - Share parameters
 */
export function shareViaProvider(provider, params) {
  const { fileName, shareLink, isEncrypted, customMessage } = params;
  const { subject, body } = generateEmailContent({ fileName, shareLink, isEncrypted, customMessage });
  
  let url = '';
  
  switch (provider) {
    case 'gmail':
      url = generateGmailLink({ subject, body });
      break;
    case 'outlook':
      url = generateOutlookLink({ subject, body });
      break;
    case 'yahoo':
      url = generateYahooLink({ subject, body });
      break;
    case 'default':
    default:
      url = generateMailtoLink({ subject, body });
      break;
  }
  
  // Open in new window
  if (provider === 'gmail' || provider === 'outlook' || provider === 'yahoo') {
    window.open(url, '_blank', 'width=800,height=600,noopener,noreferrer');
  } else {
    // mailto opens native client
    window.location.href = url;
  }
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
    console.error('Failed to copy to clipboard:', err);
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Share options configuration
 */
export const SHARE_OPTIONS = [
  {
    id: 'copy',
    label: 'Copy Link',
    icon: 'Link',
    description: 'Copy shareable link to clipboard'
  },
  {
    id: 'gmail',
    label: 'Gmail',
    icon: 'Mail',
    description: 'Send via Gmail'
  },
  {
    id: 'outlook',
    label: 'Outlook',
    icon: 'Mail',
    description: 'Send via Outlook'
  },
  {
    id: 'default',
    label: 'Email App',
    icon: 'Mail',
    description: 'Open default email client'
  }
];

/**
 * Share file via available options
 * @param {string} optionId - Share option ID
 * @param {Object} params - Share parameters
 * @returns {Promise<Object>} Share result
 */
export async function shareFile(optionId, params) {
  const { fileName, shareLink, isEncrypted, customMessage } = params;
  
  switch (optionId) {
    case 'copy':
      const copied = await copyToClipboard(shareLink);
      return { 
        success: copied, 
        message: copied ? 'Link copied to clipboard' : 'Failed to copy link' 
      };
    
    case 'gmail':
    case 'outlook':
    case 'yahoo':
    case 'default':
      shareViaProvider(optionId, { fileName, shareLink, isEncrypted, customMessage });
      return { 
        success: true, 
        message: `Opening ${optionId === 'default' ? 'email client' : optionId}...` 
      };
    
    default:
      return { 
        success: false, 
        message: 'Unknown share option' 
      };
  }
}
