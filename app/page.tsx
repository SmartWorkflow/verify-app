'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, Shield, Zap, Globe, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold" style={{color: '#1dd1a1'}}>
                Verifiey
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900 transition-colors">
                FAQ
              </Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white rounded-lg transition-colors"
                  style={{backgroundColor: '#1dd1a1'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{backgroundColor: '#1dd1a1'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Floating */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute right-4 top-16 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="py-2">
              <Link
                href="/"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/faq"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <div className="border-t my-2"></div>
              {user ? (
                <Link
                  href="/dashboard"
                  className="block mx-2 px-3 py-2 text-sm text-white rounded text-center transition-colors"
                  style={{backgroundColor: '#1dd1a1'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block mx-2 mt-1 px-3 py-2 text-sm text-white rounded text-center transition-colors"
                    style={{backgroundColor: '#1dd1a1'}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
            SMS Verification Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Receive SMS verification codes instantly in your browser. No phone needed. Perfect for testing and privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 text-white text-lg rounded-lg transition-colors font-medium"
              style={{backgroundColor: '#1dd1a1'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-100 text-black text-lg rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
            Why Choose Verifiey?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: '#d5f4e6'}}>
                <Smartphone className="w-6 h-6" style={{color: '#1dd1a1'}} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Instant SMS</h3>
              <p className="text-gray-600">
                Receive verification codes instantly in your browser. No delays, no hassle.
              </p>
            </motion.div>
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Privacy First</h3>
              <p className="text-gray-600">
                Keep your personal number private. Perfect for account verification.
              </p>
            </motion.div>
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Lightning Fast</h3>
              <p className="text-gray-600">
                Get your number and receive SMS in seconds. Optimized for speed.
              </p>
            </motion.div>
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Multiple Services</h3>
              <p className="text-gray-600">
                Works with WhatsApp, Telegram, Google, and hundreds more services.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Choose a Service</h3>
              <p className="text-gray-600">
                Select the service you need a verification code for
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Get Your Number</h3>
              <p className="text-gray-600">
                Receive a real phone number instantly in your dashboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">Receive SMS</h3>
              <p className="text-gray-600">
                View incoming messages in real-time, right in your browser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#1dd1a1'}}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8" style={{color: '#e6f9ff'}}>
            Join thousands of users who trust Verifiey for SMS verification
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-lg rounded-lg hover:bg-gray-100 transition-colors font-medium"
            style={{color: '#1dd1a1'}}
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Verifiey</h3>
              <p className="text-sm">
                SMS verification service for modern applications
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Verifiey. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
