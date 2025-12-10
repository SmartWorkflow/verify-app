'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, RefreshCw, MessageSquare, Phone, Search, X, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

interface Activation {
  id: string;
  activationId: string;
  phoneNumber: string;
  service: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  priceCharged: number;
  createdAt: string;
  expiresAt: string;
}

interface Message {
  id: string;
  activationId: string;
  code: string;
  text: string;
  receivedAt: string;
}

interface Service {
  service: string;
  code: string;
  price: string;
}

const fetcher = async (url: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const token = await user.getIdToken();
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedActivation, setSelectedActivation] = useState<Activation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: activations, mutate: mutateActivations } = useSWR<Activation[]>(
    '/api/activations',
    fetcher,
    { refreshInterval: 5000 }
  );

  // Poll SMS for active activation
  useEffect(() => {
    if (!selectedActivation || selectedActivation.status !== 'active') return;

    const pollSMS = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const response = await fetch(`/api/sms/poll?id=${selectedActivation.activationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'ok') {
            // SMS received
            toast.success('SMS received!');
            mutateActivations();
            
            // Fetch messages for this activation
            fetchMessages(selectedActivation.activationId);
          }
        }
      } catch (error) {
        console.error('Error polling SMS:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollSMS, 3000);
    
    return () => clearInterval(interval);
  }, [selectedActivation, mutateActivations]);

  // Fetch messages when activation is selected
  const fetchMessages = async (activationId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/messages?activationId=${activationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Load messages when activation changes
  useEffect(() => {
    if (selectedActivation) {
      fetchMessages(selectedActivation.activationId);
    } else {
      setMessages([]);
    }
  }, [selectedActivation]);

  // Load services and user balance
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load services
        const servicesRes = await fetch('/services.json');
        const servicesData = await servicesRes.json();
        setServices(servicesData);
        setFilteredServices(servicesData);

        // Load user balance
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const balanceRes = await fetch('/api/credits/balance', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            setUserBalance(balanceData.credits || 0);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
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

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedService(null);
  };

  const handleRequestNumber = async () => {
    if (!selectedService) return;

    // Extract price value (remove ৳ symbol and convert to number)
    const price = parseFloat(selectedService.price.replace('৳', '').replace(',', ''));
    const apiEndpoint = `${window.location.origin}/api/rentals/create?service=${encodeURIComponent(selectedService.code)}`;
    console.log('Rental API Endpoint (with params):', apiEndpoint);

    // Check if user has enough balance
    if (userBalance < price) {
      const needed = price - userBalance;
      toast.error(`Insufficient balance! You need ৳${needed.toFixed(2)} more to rent this number.`);
      return;
    }

    setIsRequesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to continue');
        return;
      }

      const token = await user.getIdToken();
      console.log('Requesting number with payload:', {
        service: selectedService.code,
        price: price,
      });
      const response = await fetch('/api/rentals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          service: selectedService.code,
          price: price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request number');
      }

      const data = await response.json();
      toast.success(`Number ${data.phoneNumber} rented successfully!`);
      
      // Update balance
      setUserBalance(prev => prev - price);
      
      // Refresh activations list and auto-select the new one
      await mutateActivations();
      
      // Auto-select the newly created activation
      const newActivation: Activation = {
        id: data.activationId,
        activationId: data.activationId,
        phoneNumber: data.phoneNumber,
        service: selectedService?.service || '',
        status: 'active',
        priceCharged: price,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt
      };
      setSelectedActivation(newActivation);
      
      handleCloseModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request number. Please try again.';
      toast.error(message);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Browse services and rent phone numbers for verification
        </p>
      </div>

      {/* Services Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Available Services</h2>
        
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
          <div className="max-h-[470px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredServices.map((service) => (
                <div
                  key={service.code}
                  onClick={() => handleServiceClick(service)}
                  className="group relative border rounded-lg p-4 cursor-pointer transition-all hover:border-[#1dd1a1] hover:shadow-md"
                >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-black truncate">{service.service}</h3>
                    <p className="text-sm font-semibold mt-1" style={{color: '#1dd1a1'}}>
                      {service.price}
                    </p>
                  </div>
                  
                  {/* Plus icon for mobile (< 1024px) */}
                  <div className="lg:hidden ml-2 shrink-0">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Get Number button for desktop (>= 1024px) - shows on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServiceClick(service);
                    }}
                    className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 items-center gap-1 px-3 py-1.5 text-white text-sm rounded-lg transition-opacity cursor-pointer"
                    style={{backgroundColor: '#1dd1a1'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
                  >
                    Get Number
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedService && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 p-4"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.2)', width: '100vw', height: '100vh'}}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-black">Confirm Rental</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="text-lg font-medium text-black">{selectedService.service}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold" style={{color: '#1dd1a1'}}>
                  {selectedService.price}
                </p>
              </div>

              {(() => {
                const price = parseFloat(selectedService.price.replace('৳', '').replace(',', ''));
                const shortfall = price - userBalance;
                
                if (shortfall > 0) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Insufficient Balance</p>
                          <p className="text-sm text-red-700 mt-1">
                            You need <span className="font-bold">৳{shortfall.toFixed(2)}</span> more to rent this number.
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Current balance: <span className="font-semibold">৳{userBalance.toFixed(2)}</span>
                          </p>
                          <p className="text-sm text-red-600 mt-2 font-medium">
                            Please top up your account to continue.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-bold">{selectedService.price}</span> will be deducted from your account.
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Current balance: <span className="font-semibold">৳{userBalance.toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-blue-700">
                        Balance after: <span className="font-semibold">৳{(userBalance - price).toFixed(2)}</span>
                      </p>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestNumber}
                disabled={isRequesting || userBalance < parseFloat(selectedService.price.replace('৳', '').replace(',', ''))}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{backgroundColor: '#1dd1a1'}}
                onMouseEnter={(e) => !isRequesting && (e.currentTarget.style.backgroundColor = '#10b186')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
              >
                {isRequesting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email-Style Layout: Sidebar + Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex h-[600px]">
          {/* Left Sidebar: Activations List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-black">Numbers</h2>
                <button
                  onClick={() => mutateActivations()}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {activations?.length || 0} active rental{activations?.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!activations || !Array.isArray(activations) || activations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Phone className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">No numbers yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rent a number to get started
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activations.map((activation) => (
                    <div
                      key={activation.activationId}
                      onClick={() => {
                        setSelectedActivation(activation);
                        fetchMessages(activation.activationId);
                      }}
                      className={`p-4 transition-all cursor-pointer ${
                        selectedActivation?.activationId === activation.activationId
                          ? 'bg-[#1dd1a1]/10 border-l-4 border-l-[#1dd1a1]'
                          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-mono font-semibold text-black">
                          {activation.phoneNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${
                            activation.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : activation.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : activation.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {activation.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1.5">
                        {activation.service}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(activation.expiresAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Messages */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {!selectedActivation ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Number Selected</h3>
                  <p className="text-sm text-gray-500">
                    Select a number from the sidebar to view messages
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-black font-mono">
                        {selectedActivation.phoneNumber}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedActivation.service}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        selectedActivation.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedActivation.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : selectedActivation.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedActivation.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Expires {format(new Date(selectedActivation.expiresAt), 'PPpp')}
                    </span>
                  </div>
                </div>

                {/* Messages Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">No messages yet</p>
                        <p className="text-xs text-gray-500">
                          Waiting for SMS to arrive...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {messages.map((msg) => (
                        <div key={msg.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-gray-500 uppercase">Verification Code</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.receivedAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-[#1dd1a1]/10 to-blue-50 rounded-lg p-6 mb-5 text-center">
                            <span className="text-5xl font-mono font-extrabold text-black tracking-widest">
                              {msg.code}
                            </span>
                          </div>
                          {msg.text && (
                            <div className="border-t border-gray-200 pt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Full Message:</p>
                              <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded">{msg.text}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
