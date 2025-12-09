'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Ban, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { auth } from '@/lib/firebase';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Multi-selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkCreditModal, setShowBulkCreditModal] = useState(false);
  const [bulkCreditAmount, setBulkCreditAmount] = useState('');
  const [bulkCreditNote, setBulkCreditNote] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const url = new URL('/api/admin/users', window.location.origin);
      if (search) url.searchParams.set('search', search);
      
      const response = await fetch(url.toString(), {
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
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
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
        toast.success(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} TAKA successfully`);
        setShowCreditModal(false);
        setCreditAmount('');
        setCreditNote('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error('Failed to update TAKA');
      }
    } catch (error) {
      toast.error('Failed to update TAKA');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('User status updated');
        fetchUsers();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openCreditModal = (user: User) => {
    setSelectedUser(user);
    setShowCreditModal(true);
    setCreditAmount('');
    setCreditNote('');
  };

  // Multi-selection functions
  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAddCredits = async () => {
    if (selectedUserIds.length === 0 || !bulkCreditAmount) return;

    const amount = parseFloat(bulkCreditAmount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    setProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users/bulk-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
          amount,
          note: bulkCreditNote,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.message}`);
        setShowBulkCreditModal(false);
        setBulkCreditAmount('');
        setBulkCreditNote('');
        setSelectedUserIds([]);
        fetchUsers();
      } else {
        throw new Error('Failed to update TAKA');
      }
    } catch (error) {
      toast.error('Failed to update TAKA for selected users');
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
        <h1 className="text-3xl font-bold text-black">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts and TAKA
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-emerald-900">
                {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedUserIds([])}
                className="text-sm text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={() => setShowBulkCreditModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add TAKA to Selected
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TAKA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.credits.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : user.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openCreditModal(user)}
                        className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                        title="Manage TAKA"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'suspended')}
                          className="text-yellow-600 hover:text-yellow-900 cursor-pointer"
                          title="Suspend User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'active')}
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'banned')}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Ban User"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Modal */}
      {showCreditModal && selectedUser && (
        <div 
          onClick={() => {
            setShowCreditModal(false);
            setSelectedUser(null);
          }}
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-black mb-4">
              Manage TAKA - {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance: {selectedUser.credits.toLocaleString()} TAKA
                </label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
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
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCredits}
                  disabled={processing || !creditAmount}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {processing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Credit Modal */}
      {showBulkCreditModal && (
        <div 
          onClick={() => {
            setShowBulkCreditModal(false);
          }}
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-black mb-4">
              Add TAKA to Multiple Users
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Users: {selectedUserIds.length}
                </label>
                <div className="text-xs text-gray-500 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded">
                  {users
                    .filter(u => selectedUserIds.includes(u.id))
                    .map(u => u.email)
                    .join(', ')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (use negative to deduct)
                </label>
                <input
                  type="number"
                  value={bulkCreditAmount}
                  onChange={(e) => setBulkCreditAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={bulkCreditNote}
                  onChange={(e) => setBulkCreditNote(e.target.value)}
                  placeholder="Reason for TAKA adjustment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBulkAddCredits}
                  disabled={processing || !bulkCreditAmount}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {processing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowBulkCreditModal(false);
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
