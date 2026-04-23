import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/libs/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Lock, Upload, Download, LogOut, Shield, History, 
  Home, Settings, File, Eye, Clock
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [storageEnabled, setStorageEnabled] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const goToEncrypt = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goToEncrypt}>
                <Home className="w-4 h-4 mr-2" />
                Encrypt
              </Button>
              <div className="text-sm text-slate-600 hidden sm:block">
                {user?.email}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-slate-600 mt-2">
            Your secure file encryption dashboard
          </p>
        </div>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <File className="w-4 h-4" />
              My Files
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={goToEncrypt}>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Encrypt & Share</CardTitle>
                  <CardDescription>
                    Upload and encrypt a file with password protection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Encrypt File
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>Storage</CardTitle>
                  <CardDescription>
                    Files are stored for 24 hours when sharing is enabled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="storage-mode">Enable Storage</Label>
                      <p className="text-xs text-slate-500">
                        Required for shareable links
                      </p>
                    </div>
                    <Switch 
                      id="storage-mode" 
                      checked={storageEnabled}
                      onCheckedChange={setStorageEnabled}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Files</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Encrypted</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Shared</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Storage</CardDescription>
                  <CardTitle className="text-3xl">0 MB</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* File List Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>Files you've encrypted and shared</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No files yet. Start by encrypting a file!</p>
                  <Button className="mt-4" onClick={goToEncrypt}>
                    <Lock className="w-4 h-4 mr-2" />
                    Encrypt First File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>All your encryption and decryption activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet. Your history will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Settings</CardTitle>
                  <CardDescription>Configure how your encrypted files are stored</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable File Storage</Label>
                      <p className="text-sm text-slate-500">
                        Store encrypted files for 24 hours to enable sharing links
                      </p>
                    </div>
                    <Switch 
                      checked={storageEnabled}
                      onCheckedChange={setStorageEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <p className="text-sm text-slate-900">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <p className="text-sm text-slate-900">{user?.user_metadata?.name || 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>SecureVault uses AES-256-GCM encryption.</p>
                  <p>Files are encrypted in your browser before being stored.</p>
                  <p>We never store your passwords.</p>
                  <p className="text-xs text-slate-400 mt-4">
                    Free tier: Files stored for 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
