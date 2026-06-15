import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const { status, user, fetchSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Re-fetch session to ensure we have the latest auth state from server
    const verifySession = async () => {
      await fetchSession();
    };

    verifySession();
  }, []);

  // Once auth status is verified and we have user data
  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (user.prepLevel) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else if (status === 'unauthenticated') {
      // Auth failed, redirect to login
      navigate('/login?error=true', { replace: true });
    }
  }, [status, user, navigate]);

  return (
    <div className="relative min-h-screen bg-bg-primary text-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Verifying your session...</p>
      </div>
    </div>
  );
}
