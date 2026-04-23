import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/libs/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the callback and stores the session
        // We just need to check auth and redirect
        await checkAuth();
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [checkAuth, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
