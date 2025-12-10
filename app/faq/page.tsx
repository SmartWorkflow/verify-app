'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Verifiey?",
      answer: "Verifiey is an SMS verification service that provides temporary phone numbers for receiving SMS verification codes. It's perfect for protecting your privacy while signing up for online services."
    },
    {
      question: "How does SMS verification work?",
      answer: "Simply choose a service from our dashboard, rent a number, and use it to receive your verification code. The SMS will appear in your dashboard within seconds. Each number is temporary and dedicated to your session."
    },
    {
      question: "How long can I use a rented number?",
      answer: "Each rented number is active for 20 minutes. During this time, you can receive multiple SMS messages to that number. After expiration, the number is released and can no longer receive messages."
    },
    {
      question: "What services are supported?",
      answer: "We support hundreds of popular services including WhatsApp, Telegram, Google, Facebook, Instagram, Twitter, Discord, and many more. Check our pricing page to see the full list of available services."
    },
    {
      question: "Is my privacy protected?",
      answer: "Absolutely! Using Verifiey means you don't have to share your personal phone number. All numbers are temporary and not linked to your identity, ensuring maximum privacy."
    },
    {
      question: "How do I add credits to my account?",
      answer: "You can add credits to your account by contacting our support team. We offer various payment methods including mobile banking, bank transfer, and other local payment options."
    },
    {
      question: "What happens if I don't receive an SMS?",
      answer: "If you don't receive an SMS within the rental period, the credits will be automatically refunded to your account. However, if the SMS is successfully delivered, the transaction is complete."
    },
    {
      question: "Can I use the same number multiple times?",
      answer: "No, once a number's rental period expires, it's released back to the pool and may be assigned to another user. For security reasons, you'll need to rent a new number for each verification."
    },
    {
      question: "How much does it cost?",
      answer: "Pricing varies by service and country. Most popular services range from ৳40 to ৳1000 per verification. Check our pricing page for detailed pricing information."
    },
    {
      question: "Is there a refund policy?",
      answer: "If you rent a number but don't receive any SMS during the rental period, you'll receive an automatic refund. Once an SMS is received, the transaction is considered complete and non-refundable."
    },
    {
      question: "Can I receive multiple SMS on one number?",
      answer: "Yes! During the active rental period (20 minutes), you can receive multiple SMS messages to the same number. All messages will appear in your dashboard."
    },
    {
      question: "Do you offer bulk pricing?",
      answer: "For high-volume users and businesses, we offer custom pricing plans. Please contact our support team to discuss your specific needs."
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

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
              <Link href="/faq" className="text-gray-900 font-medium transition-colors">
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
                className="block px-4 py-2 text-sm text-gray-900 font-medium bg-gray-50"
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

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about Verifiey SMS verification service
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-lg font-semibold text-black pr-4">
                  {faq.question}
                </span>
                {openQuestion === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                )}
              </button>
              {openQuestion === index && (
                <div className="px-6 pb-4 pt-2">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Please get in touch with our support team.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 text-white rounded-lg transition-colors font-medium"
            style={{backgroundColor: '#1dd1a1'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
          >
            Get Started Now
          </Link>
        </div>
      </div>

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
