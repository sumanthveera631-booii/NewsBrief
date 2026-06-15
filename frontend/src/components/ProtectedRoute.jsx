import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'loading') {
      // Still loading, wait
      return;
    }

    if (status === 'unauthenticated') {
      // Not authenticated, redirect to login
      navigate('/login', { replace: true });
    }
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen bg-bg-primary text-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return children;
}
