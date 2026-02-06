/**
 * Home page - redirects to dashboard for authenticated users
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Redirect to dashboard if authenticated
      router.replace('/dashboard');
    } else {
      // Redirect to sign in if not authenticated
      router.replace('/auth/signin');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-medical-500 rounded-lg flex items-center justify-center mb-4">
          <span className="text-white font-bold text-lg">DA</span>
        </div>
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-gray-600">Loading Diagnostic Analyzer...</p>
      </div>
    </div>
  );
}