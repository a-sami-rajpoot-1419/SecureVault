/**
 * SecureVault Encryption Engine
 * Uses Web Crypto API for client-side AES-256-GCM encryption
 * Passwords are never stored - only used for key derivation
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const METADATA_LENGTH_BYTES = 4; // 4 bytes for metadata length

// Password attempt tracking
const attemptStore = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if password attempts exceeded
 * @param {string} fileId - File identifier
 * @returns {Object} Attempt status
 */
export function checkPasswordAttempts(fileId) {
  const attempts = attemptStore.get(fileId);
  if (!attempts) return { allowed: true, remaining: MAX_ATTEMPTS };
  
  const now = Date.now();
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const waitMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
    return { allowed: false, remaining: 0, lockoutMinutes: waitMinutes };
  }
  
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    // Reset after lockout period
    attemptStore.delete(fileId);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
  
  const remaining = Math.max(0, MAX_ATTEMPTS - (attempts.count || 0));
  return { allowed: remaining > 0, remaining };
}

/**
 * Record failed password attempt
 * @param {string} fileId - File identifier
 */
export function recordFailedAttempt(fileId) {
  const attempts = attemptStore.get(fileId) || { count: 0 };
  attempts.count = (attempts.count || 0) + 1;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  attemptStore.set(fileId, attempts);
  return checkPasswordAttempts(fileId);
}

/**
 * Reset password attempts on successful decryption
 * @param {string} fileId - File identifier
 */
export function resetPasswordAttempts(fileId) {
  attemptStore.delete(fileId);
}

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Uint8Array} salt - Random salt
 * @returns {Promise<CryptoKey>} Derived AES key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a file using AES-256-GCM
 * @param {File} file - File to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encrypted file data with metadata
 */
export async function encryptFile(file, password) {
  try {
    console.log('[Crypto] Starting encryption for:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key from password
    console.log('[Crypto] Deriving key with PBKDF2...');
    const key = await deriveKey(password, salt);
    
    // Read file data
    console.log('[Crypto] Reading file data...');
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Encrypt the file
    console.log('[Crypto] Encrypting with AES-256-GCM...');
    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      fileArrayBuffer
    );
    
    // Create metadata JSON to preserve original file info
    const metadata = JSON.stringify({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      encrypted: Date.now()
    });
    const metadataBytes = new TextEncoder().encode(metadata);
    const metadataLength = metadataBytes.length;
    
    console.log('[Crypto] Metadata length:', metadataLength, 'Metadata:', metadata);
    
    // Combine: [salt (16)][iv (12)][metadataLength (4)][metadata (var)][encryptedData]
    const totalLength = SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES + metadataLength + encryptedData.byteLength;
    const combined = new Uint8Array(totalLength);
    
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    
    // Store metadata length as 4-byte integer (big-endian)
    const lengthBuffer = new ArrayBuffer(4);
    new DataView(lengthBuffer).setUint32(0, metadataLength, false);
    combined.set(new Uint8Array(lengthBuffer), SALT_LENGTH + IV_LENGTH);
    
    combined.set(metadataBytes, SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES);
    combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES + metadataLength);
    
    // Create encrypted blob
    const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });
    
    console.log('[Crypto] Encryption complete. Original size:', file.size, 'Encrypted size:', encryptedBlob.size);
    
    return {
      success: true,
      encryptedBlob,
      originalName: file.name,
      originalType: file.type || 'application/octet-stream',
      originalSize: file.size,
      encryptedSize: encryptedBlob.size,
      metadata: { name: file.name, type: file.type, size: file.size }
    };
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    return {
      success: false,
      error: error.message || 'Encryption failed'
    };
  }
}

/**
 * Decrypt a file using AES-256-GCM
 * @param {File|Blob} encryptedFile - Encrypted file or blob
 * @param {string} password - Decryption password
 * @param {string} fileId - File identifier for attempt tracking
 * @returns {Promise<Object>} Decrypted file data
 */
export async function decryptFile(encryptedFile, password, fileId = 'default') {
  try {
    console.log('[Crypto] Starting decryption for:', encryptedFile.name);
    
    // Check password attempts
    const attemptStatus = checkPasswordAttempts(fileId);
    if (!attemptStatus.allowed) {
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${attemptStatus.lockoutMinutes} minutes.`,
        locked: true
      };
    }
    
    // Read encrypted data
    console.log('[Crypto] Reading encrypted data...');
    const encryptedArrayBuffer = await encryptedFile.arrayBuffer();
    const encryptedData = new Uint8Array(encryptedArrayBuffer);
    
    console.log('[Crypto] Encrypted data size:', encryptedData.length);
    
    // Minimum size check: salt + iv + metadataLength + at least 1 byte metadata + some encrypted data
    if (encryptedData.length < SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES + 1) {
      throw new Error('Invalid encrypted file format - file too small');
    }
    
    // Extract salt, iv, metadata length
    const salt = encryptedData.slice(0, SALT_LENGTH);
    const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    
    // Read metadata length (4 bytes, big-endian)
    const lengthBuffer = encryptedData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES);
    const metadataLength = new DataView(lengthBuffer.buffer).getUint32(0, false);
    
    console.log('[Crypto] Metadata length:', metadataLength);
    
    if (metadataLength > 10000 || metadataLength < 0) {
      throw new Error('Invalid encrypted file format - corrupted metadata');
    }
    
    // Extract metadata
    const metadataStart = SALT_LENGTH + IV_LENGTH + METADATA_LENGTH_BYTES;
    const metadataBytes = encryptedData.slice(metadataStart, metadataStart + metadataLength);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    let metadata;
    try {
      metadata = JSON.parse(metadataJson);
    } catch (e) {
      console.error('[Crypto] Failed to parse metadata:', metadataJson);
      throw new Error('Invalid encrypted file format - cannot read metadata');
    }
    
    console.log('[Crypto] Metadata:', metadata);
    
    // Extract encrypted content
    const dataStart = metadataStart + metadataLength;
    const encryptedContent = encryptedData.slice(dataStart);
    
    console.log('[Crypto] Encrypted content size:', encryptedContent.length);
    
    // Derive key from password
    console.log('[Crypto] Deriving key...');
    const key = await deriveKey(password, salt);
    
    // Decrypt the data
    console.log('[Crypto] Decrypting...');
    let decryptedData;
    try {
      decryptedData = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encryptedContent
      );
    } catch (decryptError) {
      console.error('[Crypto] Decrypt operation failed:', decryptError);
      const newStatus = recordFailedAttempt(fileId);
      return {
        success: false,
        error: `Incorrect password. ${newStatus.remaining} attempts remaining.`,
        remainingAttempts: newStatus.remaining
      };
    }
    
    console.log('[Crypto] Decryption successful. Size:', decryptedData.byteLength);
    
    // Reset attempts on success
    resetPasswordAttempts(fileId);
    
    // Create decrypted blob with correct MIME type
    const decryptedBlob = new Blob([decryptedData], { type: metadata.type || 'application/octet-stream' });
    
    console.log('[Crypto] Decrypted blob created. Type:', metadata.type, 'Size:', decryptedBlob.size);
    
    return {
      success: true,
      decryptedBlob,
      originalName: metadata.name || 'decrypted_file',
      originalType: metadata.type || 'application/octet-stream',
      decryptedSize: decryptedBlob.size,
      metadata
    };
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    
    // Record failed attempt
    const newStatus = recordFailedAttempt(fileId);
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Decryption failed';
    if (errorMessage.includes('decrypt') || errorMessage.includes('operation')) {
      errorMessage = `Incorrect password. ${newStatus.remaining} attempts remaining.`;
    }
    
    return {
      success: false,
      error: errorMessage,
      remainingAttempts: newStatus.remaining
    };
  }
}

/**
 * Generate a suggested encrypted filename
 * @param {string} originalName - Original filename
 * @returns {string} Encrypted filename
 */
export function generateEncryptedFilename(originalName) {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  return `${baseName}_${timestamp}.enc`;
}

/**
 * Detect if a file appears to be encrypted (has .enc extension or encrypted format)
 * @param {File} file - File to check
 * @returns {boolean} True if likely encrypted
 */
export function isLikelyEncrypted(file) {
  if (!file || !file.name) return false;
  return file.name.endsWith('.enc') || file.type === 'application/octet-stream';
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export function getFileExtension(filename) {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : '';
}

/**
 * Remove .enc extension if present
 * @param {string} filename - Filename
 * @returns {string} Filename without .enc
 */
export function removeEncExtension(filename) {
  return filename.replace(/\.enc$/i, '');
}
