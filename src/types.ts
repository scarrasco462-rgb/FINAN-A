/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type AccountScope = 'personal' | 'business';

export interface Account {
  id: string;
  name: string;
  scope: AccountScope;
  initialBalance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  status: TransactionStatus;
  accountId: string;
  createdAt: number;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  balance: number;
  totalIncome: number;
  totalExpense: number;
}
