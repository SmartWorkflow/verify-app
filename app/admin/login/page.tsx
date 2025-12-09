'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Verify user is admin
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        // Not an admin - sign them out
        await auth.signOut();
        toast.error('Access denied: Admin credentials required');
        setEmail('');
        setPassword('');
      } else {
        // Is admin - redirect to admin dashboard
        toast.success('Admin login successful!');
        router.push('/admin');
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        const message = error.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : 'Authentication failed. Please try again.';
        toast.error(message);
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Admin Login</h1>
          <p className="text-gray-600">Sign in with your admin credentials</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-xl">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-black">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black placeholder-gray-400"
                style={{outlineColor: '#1dd1a1'}}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1dd1a1'}
                onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-black">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black placeholder-gray-400"
                style={{outlineColor: '#1dd1a1'}}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1dd1a1'}
                onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{backgroundColor: '#1dd1a1'}}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#10b186')}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
            >
              Sign In as Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
