import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/libs/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Download, Lock, Unlock, File, X, Eye, EyeOff, 
  Copy, CheckCircle2, AlertCircle, User, Shield, Clock,
  Mail, LogIn
} from 'lucide-react';
import { encryptFile, decryptFile, generateEncryptedFilename, isLikelyEncrypted, removeEncExtension } from '@/utils/crypto';
import { downloadBlob, formatFileSize, getFileIcon, copyToClipboard } from '@/utils/fileHandlers';
import { generateShareableLink, shareFile, SHARE_OPTIONS } from '@/utils/emailIntegration';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('encrypt');
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResult(null);
      
      // Auto-detect if file is likely encrypted
      if (isLikelyEncrypted(file)) {
        setActiveTab('decrypt');
      }
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResult(null);
      
      if (isLikelyEncrypted(file)) {
        setActiveTab('decrypt');
      }
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      let processResult;
      
      if (activeTab === 'encrypt') {
        processResult = await encryptFile(selectedFile, password);
        
        if (processResult.success) {
          setResult({
            type: 'encrypt',
            blob: processResult.encryptedBlob,
            filename: generateEncryptedFilename(selectedFile.name),
            originalName: selectedFile.name,
            originalSize: selectedFile.size,
            processedSize: processResult.encryptedSize
          });
        } else {
          setError(processResult.error || 'Encryption failed');
        }
      } else {
        // Decrypt
        console.log('[Home] Starting decryption for:', selectedFile.name);
        const fileId = selectedFile.name + '_' + selectedFile.size;
        processResult = await decryptFile(selectedFile, password, fileId);
        
        if (processResult.success) {
          console.log('[Home] Decryption successful:', processResult.originalName);
          setResult({
            type: 'decrypt',
            blob: processResult.decryptedBlob,
            filename: processResult.originalName,
            originalType: processResult.originalType,
            processedSize: processResult.decryptedSize
          });
          setAttemptsRemaining(5);
        } else {
          console.log('[Home] Decryption failed:', processResult.error);
          setError(processResult.error || 'Decryption failed');
          if (processResult.remainingAttempts !== undefined) {
            setAttemptsRemaining(processResult.remainingAttempts);
          }
          if (processResult.locked) {
            setError(processResult.error);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result?.blob && result?.filename) {
      downloadBlob(result.blob, result.filename);
    }
  };

  const handleCopyLink = async () => {
    // Generate a share token and store file data in sessionStorage
    if (result?.blob && result.blob.size < 2 * 1024 * 1024) {
      const token = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Store file data in sessionStorage with metadata
        const shareData = {
          name: result.filename,
          type: result.originalType || 'application/octet-stream',
          size: result.processedSize,
          dataUrl: reader.result,
          createdAt: Date.now()
        };
        sessionStorage.setItem(token, JSON.stringify(shareData));
        
        // Generate shareable link
        const shareUrl = `${window.location.origin}/share/${token}`;
        const copied = await copyToClipboard(shareUrl);
        
        if (copied) {
          setShareToken(token);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          console.log('[Home] Share link created:', shareUrl);
        }
      };
      reader.readAsDataURL(result.blob);
    } else {
      setError('File too large for link sharing in guest mode (max 2MB). Please download.');
    }
  };

  const handleShare = async (optionId) => {
    if (!result?.blob) return;
    
    // Generate share token and link first
    const token = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    if (result.blob.size < 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Store in sessionStorage
        const shareData = {
          name: result.filename,
          type: result.originalType || 'application/octet-stream',
          size: result.processedSize,
          dataUrl: reader.result,
          createdAt: Date.now()
        };
        sessionStorage.setItem(token, JSON.stringify(shareData));
        
        const shareUrl = `${window.location.origin}/share/${token}`;
        
        const shareResult = await shareFile(optionId, {
          fileName: result.filename,
          shareLink: shareUrl,
          isEncrypted: activeTab === 'encrypt'
        });
        
        if (shareResult.success && optionId === 'copy') {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      };
      reader.readAsDataURL(result.blob);
    } else {
      setError('File too large for email sharing in guest mode (max 2MB). Please download and share manually.');
    }
  };

  const FileIcon = getFileIcon(selectedFile?.type || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">SecureVault</h1>
                <p className="text-xs text-slate-500">Encrypt & share files securely</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="hidden sm:flex"
                >
                  <User className="w-4 h-4 mr-2" />
                  {user?.email?.split('@')[0] || 'Dashboard'}
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Text */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Secure File Encryption
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Encrypt and decrypt files with AES-256-GCM. No account required for guest mode. 
            Your password is never stored on our servers.
          </p>
        </div>

        {/* Encryption Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="encrypt" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encrypt File
                </TabsTrigger>
                <TabsTrigger value="decrypt" className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Decrypt File
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* File Upload Area */}
            {!selectedFile ? (
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-slate-400 transition-colors cursor-pointer bg-slate-50/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  Supports all file formats. Files are processed locally in your browser.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Password Input */}
            {selectedFile && !result && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {activeTab === 'encrypt' ? 'Set Encryption Password' : 'Enter Decryption Password'}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={activeTab === 'encrypt' ? 'Create a strong password (min 6 chars)' : 'Enter the password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {activeTab === 'encrypt' && (
                    <p className="text-xs text-slate-500">
                      This password will be required to decrypt the file. We don't store it anywhere.
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : activeTab === 'encrypt' ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Encrypt File
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Decrypt File
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    File {result.type === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-slate-900">{result.filename}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(result.processedSize)}</p>
                    </div>
                    {result.type === 'encrypt' && (
                      <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                        <Lock className="w-3 h-3" />
                        <span>Encrypted</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleDownload} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={handleCopyLink} className="w-full">
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Share Options */}
                {result.type === 'encrypt' && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-3">Share via:</p>
                    <div className="flex flex-wrap gap-2">
                      {SHARE_OPTIONS.filter(opt => opt.id !== 'copy').map((option) => (
                        <Button
                          key={option.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(option.id)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="ghost" onClick={clearFile} className="w-full">
                  Process Another File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">AES-256 Encryption</h3>
            <p className="text-sm text-slate-600">Military-grade encryption with password-based key derivation</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Zero-Knowledge</h3>
            <p className="text-sm text-slate-600">We never store your passwords or unencrypted files</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No Account Required</h3>
            <p className="text-sm text-slate-600">Guest mode works instantly. Sign up for history & sharing</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>SecureVault uses Web Crypto API for client-side encryption. Files never leave your browser unencrypted.</p>
        </div>
      </footer>
    </div>
  );
}
