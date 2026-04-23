import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, Unlock, Shield, File, Download, Eye, EyeOff, 
  AlertCircle, CheckCircle2, ArrowLeft, Clock
} from 'lucide-react';
import { decryptFile, checkPasswordAttempts } from '@/utils/crypto';
import { downloadBlob, formatFileSize } from '@/utils/fileHandlers';

export default function Share() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  
  // Fetch file metadata from sessionStorage
  useEffect(() => {
    console.log('[Share] Loading file for token:', token);
    
    const loadSharedFile = async () => {
      try {
        setLoading(true);
        
        // Check if there's a file in sessionStorage (for data URL shares)
        // Token is stored directly as the key (not prefixed)
        const sharedFileData = sessionStorage.getItem(token);
        
        if (sharedFileData) {
          console.log('[Share] Found file in sessionStorage');
          const parsed = JSON.parse(sharedFileData);
          
          // Check if expired (24 hours)
          const age = Date.now() - (parsed.createdAt || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (age > maxAge) {
            console.log('[Share] File expired, age:', age);
            sessionStorage.removeItem(token);
            setError('This share link has expired. Shared files are only available for 24 hours.');
          } else {
            console.log('[Share] File valid, name:', parsed.name, 'type:', parsed.type);
            setFileData({
              name: parsed.name,
              size: parsed.size,
              type: parsed.type,
              isDataUrl: true,
              dataUrl: parsed.dataUrl
            });
            
            // Check password attempts
            const attemptStatus = checkPasswordAttempts(token);
            setAttemptsRemaining(attemptStatus.remaining);
            if (!attemptStatus.allowed) {
              setError(`Too many failed attempts. Please try again in ${attemptStatus.lockoutMinutes} minutes.`);
            }
          }
        } else {
          console.log('[Share] File not found in sessionStorage');
          setError('This share link is invalid or has expired. Shared files are only available for 24 hours in guest mode.');
        }
      } catch (err) {
        console.error('[Share] Error loading file:', err);
        setError('Failed to load shared file');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      loadSharedFile();
    }
  }, [token]);
  
  const handleDecrypt = async () => {
    if (!password) {
      setError('Please enter the password');
      return;
    }
    
    if (!fileData?.dataUrl) {
      setError('File data not available');
      return;
    }
    
    setDecrypting(true);
    setError('');
    
    try {
      console.log('[Share] Converting data URL to blob...');
      // Convert data URL back to blob
      const response = await fetch(fileData.dataUrl);
      const blob = await response.blob();
      
      console.log('[Share] Decrypting file...');
      const result = await decryptFile(blob, password, token);
      
      if (result.success) {
        console.log('[Share] Decryption successful:', result.originalName);
        setDecryptedFile(result);
        setAttemptsRemaining(5);
      } else {
        console.log('[Share] Decryption failed:', result.error);
        setError(result.error || 'Decryption failed');
        if (result.remainingAttempts !== undefined) {
          setAttemptsRemaining(result.remainingAttempts);
        }
      }
    } catch (err) {
      console.error('[Share] Error during decryption:', err);
      setError('Failed to decrypt file. Please check your password.');
    } finally {
      setDecrypting(false);
    }
  };
  
  const handleDownload = () => {
    if (decryptedFile) {
      downloadBlob(decryptedFile.decryptedBlob, decryptedFile.originalName);
    }
  };
  
  const handlePreview = () => {
    if (decryptedFile && decryptedFile.decryptedBlob) {
      const url = URL.createObjectURL(decryptedFile.decryptedBlob);
      window.open(url, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading shared file...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">SecureVault</h1>
              </div>
            </div>
            
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && !fileData ? (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-6 text-center">
                <Button onClick={() => navigate('/')}>
                  Go to SecureVault
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Encrypted File Shared</CardTitle>
              <CardDescription>
                This file has been encrypted and shared with you securely
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {fileData && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{fileData.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(fileData.size)} • Encrypted
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!decryptedFile ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Enter Decryption Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter the password shared by the sender"
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
                    <p className="text-xs text-slate-500">
                      The password was shared with you separately by the sender.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleDecrypt} 
                    disabled={decrypting || !password}
                    className="w-full"
                    size="lg"
                  >
                    {decrypting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Decrypt & Access File
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      File decrypted successfully!
                    </AlertDescription>
                  </Alert>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-slate-900">{decryptedFile.originalName}</p>
                        <p className="text-sm text-slate-500">{formatFileSize(decryptedFile.decryptedSize)}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                        <Unlock className="w-3 h-3" />
                        <span>Decrypted</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={handleDownload} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {decryptedFile.originalType?.startsWith('image/') || 
                       decryptedFile.originalType?.includes('pdf') ? (
                        <Button variant="outline" onClick={handlePreview} className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setDecryptedFile(null);
                      setPassword('');
                      setError('');
                    }} 
                    className="w-full"
                  >
                    Decrypt Another File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Files are encrypted using AES-256-GCM. The password is never stored.
          </p>
        </div>
      </main>
    </div>
  );
}
