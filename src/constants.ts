import { Category } from './types';

export const STORAGE_KEY_PREFIX = 'smart_finance_';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'Utensils', color: '#EF4444' },
  { id: '2', name: 'Moradia', icon: 'Home', color: '#3B82F6' },
  { id: '3', name: 'Transporte', icon: 'Car', color: '#F59E0B' },
  { id: '4', name: 'Lazer', icon: 'Gamepad', color: '#10B981' },
  { id: '5', name: 'Saúde', icon: 'Heart', color: '#EC4899' },
  { id: '6', name: 'Educação', icon: 'Book', color: '#8B5CF6' },
  { id: '7', name: 'Salário', icon: 'DollarSign', color: '#059669' },
  { id: '8', name: 'Outros', icon: 'Plus', color: '#6B7280' },
];
