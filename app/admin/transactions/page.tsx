'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'refund' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: {
    adminNote?: string;
  };
  createdAt: string;
  userFullName?: string;
  userEmail?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [userIdFilter]);

  const fetchTransactions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const url = new URL('/api/admin/transactions', window.location.origin);
      if (userIdFilter) url.searchParams.set('userId', userIdFilter);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Fetch user details for each transaction
        const transactionsWithUserInfo = await Promise.all(
          data.map(async (transaction: Transaction) => {
            try {
              const userResponse = await fetch(`/api/admin/users/${transaction.userId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...transaction,
                  userFullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A',
                  userEmail: userData.email || 'N/A',
                };
              }
            } catch (error) {
              console.error('Error fetching user details:', error);
            }
            return {
              ...transaction,
              userFullName: 'N/A',
              userEmail: 'N/A',
            };
          })
        );
        
        setTransactions(transactionsWithUserInfo);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'credit' || type === 'refund') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'bg-green-100 text-green-700';
      case 'debit':
        return 'bg-red-100 text-red-700';
      case 'refund':
        return 'bg-blue-100 text-blue-700';
      case 'admin_adjustment':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Transactions</h1>
          <p className="text-gray-600 mt-2">
            View all platform transactions
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-black"
        >
          <RefreshCw className="w-4 h-4 text-black" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Filter by User ID..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-gray-400"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance After
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    onClick={() => setSelectedTransaction(transaction)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                            transaction.type
                          )}`}
                        >
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{transaction.description}</div>
                      {transaction.metadata?.adminNote && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {transaction.metadata.adminNote}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span
                        className={`font-semibold ${
                          transaction.type === 'credit' || transaction.type === 'refund'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' || transaction.type === 'refund'
                          ? '+'
                          : '-'}
                        {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {transaction.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            transactions.map((transaction) => (
              <button
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.type)}
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      transaction.type === 'credit' || transaction.type === 'refund'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'credit' || transaction.type === 'refund'
                      ? '+'
                      : '-'}
                    {transaction.amount.toLocaleString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div
          onClick={() => setSelectedTransaction(null)}
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Holder</label>
                <p className="text-base text-gray-900 mt-1 font-medium">
                  {selectedTransaction.userFullName || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-base text-gray-900 mt-1">
                  {selectedTransaction.userEmail || 'N/A'}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="text-base text-gray-900 mt-1">
                  {format(new Date(selectedTransaction.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                      selectedTransaction.type
                    )}`}
                  >
                    {selectedTransaction.type}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-base text-gray-900 mt-1">
                  {selectedTransaction.description}
                </p>
              </div>

              {selectedTransaction.metadata?.adminNote && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Note</label>
                  <p className="text-base text-gray-900 mt-1">
                    {selectedTransaction.metadata.adminNote}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p
                  className={`text-2xl font-semibold mt-1 ${
                    selectedTransaction.type === 'credit' || selectedTransaction.type === 'refund'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedTransaction.type === 'credit' || selectedTransaction.type === 'refund'
                    ? '+'
                    : '-'}
                  {selectedTransaction.amount.toLocaleString()} TAKA
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Balance Before</label>
                <p className="text-base text-gray-900 mt-1">
                  {selectedTransaction.balanceBefore.toLocaleString()} TAKA
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Balance After</label>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {selectedTransaction.balanceAfter.toLocaleString()} TAKA
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTransaction(null)}
              className="w-full mt-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
