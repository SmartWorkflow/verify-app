'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Users, CreditCard, BarChart3, Menu, X, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<'ok' | 'low' | 'error'>('ok');
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!loading && !user) {
        router.push('/admin-login');
        return;
      }

      if (!loading && user) {
        try {
          // Check if user has admin role
          const token = await user.getIdToken();
          const response = await fetch('/api/admin/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.status === 401) {
            // Not an admin - sign them out completely
            await signOut();
            toast.error('Access denied: Admin credentials required');
            router.push('/admin-login');
          } else {
            setIsAdmin(true);
            // Fetch API balance
            fetchApiBalance();
          }
        } catch (error) {
          await signOut();
          toast.error('Access denied');
          router.push('/admin-login');
        } finally {
          setChecking(false);
        }
      }
    }

    checkAdmin();
  }, [user, loading, router, signOut]);

  const fetchApiBalance = async () => {
    try {
      setLoadingBalance(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiBalance(data.balance);
        setBalanceStatus(data.status);
        
        if (data.status === 'low') {
          toast.error('⚠️ API balance is low! Please add funds.');
        }
      } else {
        setBalanceStatus('error');
        console.error('Failed to fetch API balance');
      }
    } catch (error) {
      console.error('Error fetching API balance:', error);
      setBalanceStatus('error');
    } finally {
      setLoadingBalance(false);
    }
  };

  // Refresh balance every 5 minutes
  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(fetchApiBalance, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/admin-login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Link href="/admin" className="text-2xl font-bold" style={{color: '#1dd1a1'}}>
                Verifiey
              </Link>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* API Balance Display */}
              <div 
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium relative group cursor-help
                  ${balanceStatus === 'low' ? 'bg-red-100 text-red-700' : 
                    balanceStatus === 'error' ? 'bg-gray-100 text-gray-500' : 
                    'bg-emerald-100 text-emerald-700'}
                `}
                title="API Balance"
              >
                {loadingBalance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : balanceStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Balance Error</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold">
                      ${apiBalance?.toFixed(2) || '0.00'}
                    </span>
                    {balanceStatus === 'low' && (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </>
                )}
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  API Balance
                </div>
              </div>
              
              <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed xl:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r z-30
          transition-all duration-300 ease-in-out
          ${sidebarExpanded ? 'w-64' : 'w-16'}
          xl:w-64
        `}>
          {/* Expand/Collapse Button at top of sidebar - Mobile/Tablet Only */}
          <div className="absolute top-2 left-4 xl:hidden">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              {sidebarExpanded ? <X className="w-4 h-4 text-black" /> : <Menu className="w-4 h-4 text-black" />}
            </button>
          </div>

          <nav className="p-2 space-y-1 h-full overflow-y-auto pt-14 xl:pt-2">
            <Link
              href="/admin"
              onClick={() => setSidebarExpanded(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Dashboard"
            >
              <BarChart3 className="w-5 h-5 shrink-0" />
              <span className={`
                whitespace-nowrap overflow-hidden transition-all
                ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                xl:opacity-100 xl:w-auto
              `}>
                Dashboard
              </span>
            </Link>
            <Link
              href="/admin/users"
              onClick={() => setSidebarExpanded(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Users"
            >
              <Users className="w-5 h-5 shrink-0" />
              <span className={`
                whitespace-nowrap overflow-hidden transition-all
                ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                xl:opacity-100 xl:w-auto
              `}>
                Users
              </span>
            </Link>
            <Link
              href="/admin/transactions"
              onClick={() => setSidebarExpanded(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Transactions"
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              <span className={`
                whitespace-nowrap overflow-hidden transition-all
                ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                xl:opacity-100 xl:w-auto
              `}>
                Transactions
              </span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen ml-16 xl:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
