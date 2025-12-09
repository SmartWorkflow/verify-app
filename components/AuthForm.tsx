'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Successfully logged in!');
      router.push('/dashboard');
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
    <>
      {/* Loading Overlay - positioned to cover parent container */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-xl">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
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
          placeholder="you@example.com"
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
        Sign In
      </button>
    </form>
    </>
  );
}
