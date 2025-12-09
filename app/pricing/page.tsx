'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Service {
  service: string;
  code: string;
  price: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesRes = await fetch('/services.json');
        const servicesData = await servicesRes.json();
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };

    loadServices();
  }, []);

  // Filter services based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = services.filter(service =>
        service.service.toLowerCase().includes(query) ||
        service.code.toLowerCase().includes(query)
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

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
              <Link href="/pricing" className="text-gray-900 font-medium transition-colors">
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
                className="block px-4 py-2 text-sm text-gray-900 font-medium bg-gray-50"
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

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Pay only for what you use. No subscriptions, no hidden fees.
          </p>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-black">Available Services</h2>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black placeholder:text-gray-400"
              style={{borderColor: '#e5e7eb'}}
              onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1dd1a1'}
              onBlur={(e) => e.currentTarget.style.boxShadow = ''}
            />
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No services found</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredServices.map((service) => (
                  <div
                    key={service.code}
                    className="border rounded-lg p-4 hover:border-[#1dd1a1] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-black truncate">{service.service}</h3>
                        <p className="text-sm font-semibold mt-1" style={{color: '#1dd1a1'}}>
                          {service.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
              1
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">No Subscription</h3>
            <p className="text-gray-600 text-sm">
              Pay per verification. No monthly fees or commitments required.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
              2
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Instant Access</h3>
            <p className="text-gray-600 text-sm">
              Top up your account and start using services immediately.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{backgroundColor: '#1dd1a1'}}>
              3
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Bulk Discounts</h3>
            <p className="text-gray-600 text-sm">
              Contact us for custom pricing on high-volume usage.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center rounded-xl p-12" style={{backgroundColor: '#1dd1a1'}}>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8" style={{color: '#e6f9ff'}}>
            Create your account and start receiving SMS verification codes today
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            style={{color: '#1dd1a1'}}
          >
            Create Free Account
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
