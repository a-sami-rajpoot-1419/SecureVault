import { useAuth } from '@/libs/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Upload, Download, LogOut, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">SecureVault</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
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
            Securely encrypt, store, and share your files
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Encrypt File</CardTitle>
              <CardDescription>
                Upload and encrypt a file with password protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Upload File
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Decrypt File</CardTitle>
              <CardDescription>
                Download and decrypt a previously encrypted file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Browse Files
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>View History</CardTitle>
              <CardDescription>
                See all your encryption and decryption logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <CardDescription>Decrypted</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Storage Used</CardDescription>
              <CardTitle className="text-3xl">0 MB</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-8 bg-slate-900 text-white">
          <CardHeader>
            <CardTitle>🚧 Under Development</CardTitle>
            <CardDescription className="text-slate-300">
              This dashboard is currently being built. Encryption and file management features will be available soon!
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
