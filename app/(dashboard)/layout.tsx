'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Wallet, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('[Dashboard Layout] Auth check - loading:', loading, 'user:', user?.email || 'null', 'isRedirecting:', isRedirecting);
    if (!loading) {
      if (!user) {
        console.log('[Dashboard Layout] No user, redirecting to login');
        setIsRedirecting(true);
        router.replace('/login');
      } else {
        console.log('[Dashboard Layout] User authenticated:', user.email);
        console.log('[Dashboard Layout] Current cookies:', document.cookie);
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  // Listen for real-time credit updates via WebSocket
  useEffect(() => {
    if (socket) {
      socket.on('credit-update', (data: { credits: number }) => {
        console.log('Credit update received:', data);
        setCredits(data.credits);
        toast.success('Credit balance updated!', { icon: '💰' });
      });

      socket.on('transaction', (transaction: { id: string; amount: number; type: string }) => {
        console.log('Transaction received:', transaction);
        // Refresh credits when transaction occurs
        fetchCredits();
      });

      return () => {
        socket.off('credit-update');
        socket.off('transaction');
      };
    }
  }, [socket]);

  const fetchCredits = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{borderColor: '#1dd1a1'}}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold" style={{color: '#1dd1a1'}}>
                Verifiey
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* Credit Balance Display */}
              <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-gray-200 min-w-[180px]">
                <div className="flex items-center gap-4 pr-6">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs text-gray-500">Balance</div>
                    <div className="text-lg font-bold text-gray-900 break-all max-w-52">
                      {loadingCredits ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        `${credits.toLocaleString()} TAKA`
                      )}
                    </div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-300 mx-2" />
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded-md transition-colors cursor-pointer"
                  style={{backgroundColor: '#1dd1a1'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10b186'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1dd1a1'}
                  onClick={() => toast('Contact admin to add credits', { icon: '💳' })}
                >
                  <Plus className="w-4 h-4" />
                  Top Up
                </button>
              </div>

              {/* <span className="text-sm text-gray-600">{user.email}</span> */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
