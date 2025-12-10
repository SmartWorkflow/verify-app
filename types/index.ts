export interface PhoneNumber {
  id: string;
  userId: string;
  number: string;
  service: string;
  status: 'active' | 'expired' | 'cancelled';
  activationId: string;
  createdAt: string;
  expiresAt: string;
}

export interface SMS {
  id: string;
  phoneNumberId: string;
  from: string;
  message: string;
  receivedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  credits: number;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'refund' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: {
    adminId?: string;
    adminNote?: string;
    [key: string]: string | number | boolean | undefined;
  };
  createdAt: string;
}
