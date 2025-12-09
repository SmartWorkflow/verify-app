'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

export default function SignupForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validate all fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast.error('All fields are required.');
      return;
    }
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number.');
      return;
    }
    setLoading(true);

    try {
      await signUp(email, password, {
        firstName,
        lastName,
        phone,
        email
      });
      toast.success('Account created successfully!');
      router.push('/welcome');
    } catch (error) {
      if (error instanceof FirebaseError) {
        const message = error.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : error.code === 'auth/weak-password'
          ? 'Password should be at least 6 characters'
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
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-xl">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-black">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black placeholder-gray-400"
            style={{outlineColor: '#1dd1a1'}}
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1dd1a1'}
            onBlur={(e) => e.currentTarget.style.boxShadow = ''}
            placeholder="John"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-black">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black placeholder-gray-400"
            style={{outlineColor: '#1dd1a1'}}
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1dd1a1'}
            onBlur={(e) => e.currentTarget.style.boxShadow = ''}
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2 text-black">
          Phone Number
        </label>
        <PhoneInput
          defaultCountry="bd"
          value={phone}
          onChange={(phone) => setPhone(phone)}
          inputClassName="phone-input-field"
          countrySelectorStyleProps={{
            buttonClassName: "phone-country-button"
          }}
          inputProps={{ required: true }}
        />
      </div>
      
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
        Sign Up
      </button>
    </form>
    </>
  );
}
