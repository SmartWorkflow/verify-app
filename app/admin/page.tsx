'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCredits: number;
  recentTransactions: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  credits: number;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    const amount = parseFloat(creditAmount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    setProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          note: creditNote,
        }),
      });

      if (response.ok) {
        toast.success('TAKA updated successfully');
        setShowUserDropdown(false);
        setSelectedUser(null);
        setCreditAmount('');
        setCreditNote('');
        fetchStats();
        fetchUsers();
      } else {
        toast.error('Failed to update TAKA');
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-black mt-2">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-black mt-2">
                {stats?.activeUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total TAKA</p>
              <p className="text-3xl font-bold text-black mt-2">
                {stats?.totalCredits?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Transactions (24h)</p>
              <p className="text-3xl font-bold text-black mt-2">
                {stats?.recentTransactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <Users className="w-6 h-6 text-gray-600 mb-2" />
            <h3 className="font-semibold text-black">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">
              View and manage user accounts
            </p>
          </a>
          <a
            href="/admin/transactions"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <Activity className="w-6 h-6 text-gray-600 mb-2" />
            <h3 className="font-semibold text-black">View Transactions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Monitor all platform transactions
            </p>
          </a>
          <button
            onClick={() => setShowUserDropdown(true)}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 transition-colors cursor-pointer text-left"
          >
            <DollarSign className="w-6 h-6 text-gray-600 mb-2" />
            <h3 className="font-semibold text-black">
              Add TAKA
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select a user to add TAKA
            </p>
          </button>
        </div>
      </div>

      {/* Full Page User Selection & Credit Management Popup */}
      {showUserDropdown && (
        <div 
          onClick={() => {
            setShowUserDropdown(false);
            setSelectedUser(null);
            setCreditAmount('');
            setCreditNote('');
          }}
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-6xl h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Add TAKA to User</h2>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setSelectedUser(null);
                  setCreditAmount('');
                  setCreditNote('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* User List - Left Side */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-black mb-4">Select User</h3>
                  {users.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No users found</div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={`w-full p-4 rounded-lg text-left transition-all cursor-pointer ${
                            selectedUser?.id === user.id
                              ? 'bg-emerald-50 border-2 border-emerald-500'
                              : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-black">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                          <div className="text-sm font-medium text-emerald-600 mt-2">
                            Balance: {user.credits.toLocaleString()} TAKA
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TAKA Management Form - Right Side */}
              <div className="w-1/2 overflow-y-auto">
                <div className="p-6">
                  {selectedUser ? (
                    <>
                      <h3 className="text-lg font-semibold text-black mb-6">
                        Manage TAKA - {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-emerald-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Balance
                          </label>
                          <p className="text-3xl font-bold text-emerald-600">
                            {selectedUser.credits.toLocaleString()} TAKA
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (use negative to deduct)
                          </label>
                          <input
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            placeholder="e.g., 100 or -50"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note (optional)
                          </label>
                          <textarea
                            value={creditNote}
                            onChange={(e) => setCreditNote(e.target.value)}
                            placeholder="Reason for TAKA adjustment..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={handleAddCredits}
                            disabled={processing || !creditAmount}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
                          >
                            {processing ? 'Processing...' : 'Confirm & Add TAKA'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(null);
                              setCreditAmount('');
                              setCreditNote('');
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer font-medium"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Select a user from the list</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
