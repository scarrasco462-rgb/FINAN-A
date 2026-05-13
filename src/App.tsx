import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PlusCircle, 
  History, 
  TrendingUp, 
  Wallet,
  Menu,
  X,
  ChevronRight,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Wifi,
  Github,
  Pencil,
  User,
  Briefcase,
  Plus,
  Building2,
  ChevronDown,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Transaction, TransactionType, Category, TransactionStatus, Account, AccountScope } from './types';
import { DEFAULT_CATEGORIES, STORAGE_KEY_PREFIX } from './constants';
import { cn, formatCurrency, formatDate } from './utils';

export default function App() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'add'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [scopeForNewAccount, setScopeForNewAccount] = useState<AccountScope>('personal');

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [type, setType] = useState<TransactionType>('expense');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  // Account Form State
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');

  // Load data
  useEffect(() => {
    const savedTransactions = localStorage.getItem(`${STORAGE_KEY_PREFIX}transactions`);
    const savedAccounts = localStorage.getItem(`${STORAGE_KEY_PREFIX}accounts`);

    if (savedAccounts) {
      const parsedAccounts = JSON.parse(savedAccounts);
      setAccounts(parsedAccounts);
      if (parsedAccounts.length > 0) {
        setCurrentAccountId(parsedAccounts[0].id);
      }
    } else {
      // Create initial accounts
      const initialAccounts: Account[] = [
        { id: 'acc_personal_1', name: 'Conta Principal', scope: 'personal', initialBalance: 0, color: '#3B82F6' },
        { id: 'acc_business_1', name: 'Empresa Alpha', scope: 'business', initialBalance: 0, color: '#10B981' }
      ];
      setAccounts(initialAccounts);
      setCurrentAccountId(initialAccounts[0].id);
    }

    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        // Migration: add status and accountId to old transactions if missing
        const migrated = parsed.map((t: any) => ({
          ...t,
          status: t.status || (t.type === 'income' ? 'paid' : 'pending'),
          accountId: t.accountId || 'acc_personal_1'
        }));
        setTransactions(migrated);
      } catch (e) {
        console.error('Erro ao carregar dados', e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}transactions`, JSON.stringify(transactions));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}accounts`, JSON.stringify(accounts));
    setSyncStatus('syncing');
    const timer = setTimeout(() => setSyncStatus('online'), 1000);
    return () => clearTimeout(timer);
  }, [transactions, accounts]);

  const currentAccount = useMemo(() => 
    accounts.find(a => a.id === currentAccountId) || null
  , [accounts, currentAccountId]);

  // Calculations
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    // Filter by account
    if (currentAccountId) {
      result = result.filter(t => t.accountId === currentAccountId);
    }

    // Filter by month
    if (selectedMonth === 'Todos') return result;
    
    return result.filter(t => {
      const [year, month] = t.date.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return capitalized === selectedMonth;
    });
  }, [transactions, selectedMonth, currentAccountId]);

  const totals = useMemo(() => {
    const initial = currentAccount?.initialBalance || 0;
    return filteredTransactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: initial, expense: 0 });
  }, [filteredTransactions, currentAccount]);

  const balance = totals.income - totals.expense;

  const chartData = useMemo(() => {
    if (selectedMonth !== 'Todos') {
      // Show full month data if a month is selected
      const [mName, yearStr] = selectedMonth.split(' de ');
      const monthIndex = new Date(Date.parse(mName + " 1, 2012")).getMonth();
      const year = parseInt(yearStr);
      
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, monthIndex, i + 1);
        return d.toISOString().split('T')[0];
      });

      return days.map(day => {
        const dayTransactions = filteredTransactions.filter(t => t.date === day);
        const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return {
          name: day.split('-')[2],
          receita: income,
          despesa: expense
        };
      });
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(day => {
      const dayTransactions = transactions.filter(t => t.date === day);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        name: day.split('-').slice(1).reverse().join('/'),
        receita: income,
        despesa: expense
      };
    });
  }, [transactions, filteredTransactions, selectedMonth]);

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const groups = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const availableMonths = useMemo(() => {
    const accountTransactions = transactions.filter(t => t.accountId === currentAccountId);
    const months = accountTransactions.map(t => {
      const [year, month] = t.date.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    });
    // Sort months chronologically (newest first)
    const uniqueMonths = (Array.from(new Set(months)) as string[]).sort((a, b) => {
      const parse = (s: string) => {
        const [m, y] = s.split(' de ');
        const monthIndex = new Date(Date.parse(m + " 1, 2012")).getMonth();
        return new Date(parseInt(y), monthIndex).getTime();
      };
      return parse(b) - parse(a);
    });
    return ['Todos', ...uniqueMonths];
  }, [transactions, currentAccountId]);

  // Group transactions by month
  const groupedTransactions = useMemo(() => {
    const accountTransactions = transactions.filter(t => t.accountId === currentAccountId);
    const sorted = [...accountTransactions].sort((a, b) => b.date.localeCompare(a.date));
    const groups: Record<string, Transaction[]> = {};
    
    sorted.forEach(t => {
      const [year, month] = t.date.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      if (!groups[capitalized]) groups[capitalized] = [];
      groups[capitalized].push(t);
    });
    
    const entries = Object.entries(groups);
    if (selectedMonth === 'Todos') return entries;
    return entries.filter(([month]) => month === selectedMonth);
  }, [transactions, selectedMonth, currentAccountId]);

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !currentAccountId) return;

    if (editingId) {
      setTransactions(transactions.map(t => 
        t.id === editingId 
          ? { ...t, description, amount: parseFloat(amount), date, category, type, status }
          : t
      ));
      setEditingId(null);
    } else if (isRecurring && endDate) {
      const newTransactions: Transaction[] = [];
      let current = new Date(date + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      while (current <= end) {
        newTransactions.push({
          id: crypto.randomUUID(),
          description: `${description} (${current.getMonth() + 1}/${current.getFullYear()})`,
          amount: parseFloat(amount),
          date: current.toISOString().split('T')[0],
          category,
          type,
          status,
          accountId: currentAccountId,
          createdAt: Date.now()
        });
        // Move to next month
        current.setMonth(current.getMonth() + 1);
      }
      setTransactions([...newTransactions, ...transactions]);
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount),
        date,
        category,
        type,
        status,
        accountId: currentAccountId,
        createdAt: Date.now()
      };
      setTransactions([newTransaction, ...transactions]);
    }

    setDescription('');
    setAmount('');
    setStatus('pending');
    setIsRecurring(false);
    setEndDate('');
    setActiveTab('dashboard');
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName) return;

    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: newAccountName,
      scope: scopeForNewAccount,
      initialBalance: parseFloat(newAccountBalance) || 0,
      color: scopeForNewAccount === 'personal' ? '#3B82F6' : '#10B981'
    };

    setAccounts([...accounts, newAccount]);
    setCurrentAccountId(newAccount.id);
    setNewAccountName('');
    setNewAccountBalance('0');
    setShowAccountModal(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const startEditing = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setDate(t.date);
    setCategory(t.category);
    setType(t.type);
    setStatus(t.status);
    setActiveTab('add');
  };

  const toggleStatus = (id: string) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, status: t.status === 'paid' ? 'pending' : 'paid' } : t
    ));
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="bg-brand-blue text-white flex flex-col h-screen sticky top-0 z-50 overflow-hidden shadow-xl"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 gold-gradient rounded-lg flex items-center justify-center">
                  <span className="text-brand-blue font-bold">S</span>
                </div>
                <span className="font-bold text-xl tracking-tight">Smart <span className="text-brand-gold">Finance</span></span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Scopes Section */}
          <div className="space-y-6">
            {/* Personal Scope */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <User size={14} />
                  {sidebarOpen && "Pessoal"}
                </div>
                {sidebarOpen && (
                  <button 
                    onClick={() => {
                      setScopeForNewAccount('personal');
                      setShowAccountModal(true);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {accounts.filter(a => a.scope === 'personal').map(account => (
                  <div key={account.id} className="space-y-1">
                    <AccountSidebarItem 
                      account={account}
                      active={currentAccountId === account.id}
                      onClick={() => {
                        setCurrentAccountId(account.id);
                        if (currentAccountId !== account.id) setActiveTab('dashboard');
                      }}
                      collapsed={!sidebarOpen}
                    />
                    {currentAccountId === account.id && sidebarOpen && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-6 pl-4 border-l border-white/10 space-y-1 mt-1"
                      >
                        <SubItem 
                          icon={<LayoutDashboard size={14} />} 
                          label="Dashboard" 
                          active={activeTab === 'dashboard'} 
                          onClick={() => setActiveTab('dashboard')} 
                        />
                        <SubItem 
                          icon={<History size={14} />} 
                          label="Lançamentos" 
                          active={activeTab === 'transactions'} 
                          onClick={() => setActiveTab('transactions')} 
                        />
                        <SubItem 
                          icon={<PlusCircle size={14} />} 
                          label="Novo Gasto" 
                          active={activeTab === 'add'} 
                          onClick={() => setActiveTab('add')} 
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Business Scope */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Briefcase size={14} />
                  {sidebarOpen && "Empresa"}
                </div>
                {sidebarOpen && (
                  <button 
                    onClick={() => {
                      setScopeForNewAccount('business');
                      setShowAccountModal(true);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {accounts.filter(a => a.scope === 'business').map(account => (
                  <div key={account.id} className="space-y-1">
                    <AccountSidebarItem 
                      account={account}
                      active={currentAccountId === account.id}
                      onClick={() => {
                        setCurrentAccountId(account.id);
                        if (currentAccountId !== account.id) setActiveTab('dashboard');
                      }}
                      collapsed={!sidebarOpen}
                    />
                    {currentAccountId === account.id && sidebarOpen && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-6 pl-4 border-l border-white/10 space-y-1 mt-1"
                      >
                        <SubItem 
                          icon={<LayoutDashboard size={14} />} 
                          label="Dashboard" 
                          active={activeTab === 'dashboard'} 
                          onClick={() => setActiveTab('dashboard')} 
                        />
                        <SubItem 
                          icon={<History size={14} />} 
                          label="Lançamentos" 
                          active={activeTab === 'transactions'} 
                          onClick={() => setActiveTab('transactions')} 
                        />
                        <SubItem 
                          icon={<PlusCircle size={14} />} 
                          label="Novo Gasto" 
                          active={activeTab === 'add'} 
                          onClick={() => setActiveTab('add')} 
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Github size={16} />
            {sidebarOpen && <span>v4.1.0-stable</span>}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Finance</span>
            <ChevronRight size={14} />
            <span className="text-brand-blue capitalize">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all",
              syncStatus === 'online' ? "bg-emerald-100 text-emerald-700" : 
              syncStatus === 'syncing' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
            )}>
              <Wifi size={14} className={syncStatus === 'syncing' ? "animate-pulse" : ""} />
              {syncStatus.toUpperCase()}
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">
              SC
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Account Header Info */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-brand-blue tracking-tight">
                {currentAccount?.name || 'Saldo Geral'}
              </h1>
              <p className="text-slate-500 font-medium">
                {currentAccount?.scope === 'personal' ? 'Finanças Pessoais' : 'Gestão Empresarial'}
              </p>
            </div>
            <div className="no-print">
              <button 
                onClick={handlePrint}
                className="app-button-primary"
              >
                <Printer size={18} />
                Imprimir Relatório
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {availableMonths.map(month => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                      selectedMonth === month 
                        ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" 
                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                  title="Saldo Atual" 
                  value={balance} 
                  icon={<Wallet className="text-brand-blue" />} 
                  trend={balance >= 0 ? 'up' : 'down'}
                />
                <KpiCard 
                  title="Receitas" 
                  value={totals.income} 
                  icon={<ArrowUpCircle className="text-emerald-500" />} 
                  trend="up"
                  color="emerald"
                />
                <KpiCard 
                  title="Despesas" 
                  value={totals.expense} 
                  icon={<ArrowDownCircle className="text-rose-500" />} 
                  trend="down"
                  color="rose"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="app-card p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} className="text-brand-blue" />
                      {selectedMonth === 'Todos' ? 'Fluxo de Caixa (7 dias)' : `Fluxo de Caixa - ${selectedMonth}`}
                    </div>
                    {selectedMonth !== 'Todos' && (
                      <span className="text-xs font-normal text-slate-400">Dias do mês</span>
                    )}
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="app-card p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Tag size={20} className="text-brand-blue" />
                    Gastos por Categoria
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="app-card overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Últimos Lançamentos</h3>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-brand-blue font-medium hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map(t => (
                    <TransactionItem key={t.id} transaction={t} onDelete={deleteTransaction} />
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      Nenhum lançamento encontrado.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-blue">Extrato de Lançamentos</h2>
                <button 
                  onClick={handlePrint}
                  className="app-button-primary"
                >
                  <Printer size={18} />
                  Imprimir Planilha
                </button>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {availableMonths.map(month => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                      selectedMonth === month 
                        ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" 
                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>

              {groupedTransactions.map(([month, items]) => (
                <div key={month} className="app-card overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{month}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map(t => (
                      <TransactionItem 
                        key={t.id} 
                        transaction={t} 
                        onDelete={deleteTransaction} 
                        onEdit={startEditing}
                        onToggleStatus={toggleStatus}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="app-card p-12 text-center text-slate-400">
                  Nenhum lançamento encontrado.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="app-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-brand-blue">
                    {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                  </h2>
                  {editingId && (
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setDescription('');
                        setAmount('');
                        setActiveTab('dashboard');
                      }}
                      className="text-sm text-slate-400 hover:text-slate-600"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={cn(
                        "py-2 rounded-lg font-bold transition-all",
                        type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={cn(
                        "py-2 rounded-lg font-bold transition-all",
                        type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Receita
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                      <History size={16} /> Descrição
                    </label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Aluguel, Supermercado..."
                      className="app-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <DollarSign size={16} /> Valor (R$)
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="app-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Calendar size={16} /> Data de Início
                      </label>
                      <input 
                        type="date" 
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="app-input"
                        required
                      />
                    </div>
                  </div>

                  {!editingId && (
                    <div className="vettus-card p-4 bg-slate-50 border-dashed border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <History size={18} className="text-brand-blue" />
                          <span className="font-bold text-slate-700">Pagamento Recorrente?</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRecurring(!isRecurring)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            isRecurring ? "bg-brand-blue" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            isRecurring ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                      
                      {isRecurring && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <Calendar size={16} /> Repetir até (Data Final)
                          </label>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="app-input bg-white"
                            required={isRecurring}
                            min={date}
                          />
                          <p className="text-[10px] text-slate-400 italic">
                            * O sistema criará um lançamento mensal entre as datas selecionadas.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Tag size={16} /> Categoria
                      </label>
                      <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="app-input appearance-none"
                      >
                        {DEFAULT_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <PlusCircle size={16} /> Status
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setStatus('paid')}
                          className={cn(
                            "py-1.5 rounded-md text-xs font-bold transition-all",
                            status === 'paid' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                          )}
                        >
                          Pago
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus('pending')}
                          className={cn(
                            "py-1.5 rounded-md text-xs font-bold transition-all",
                            status === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"
                          )}
                        >
                          Pendente
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="app-button-gold w-full py-4 text-lg mt-4">
                    {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Account Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccountModal(false)}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
                  {scopeForNewAccount === 'personal' ? <User className="text-blue-500" /> : <Briefcase className="text-emerald-500" />}
                  Nova Conta {scopeForNewAccount === 'personal' ? 'Pessoal' : 'Empresa'}
                </h3>
                <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Nome da Conta</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newAccountName}
                    onChange={e => setNewAccountName(e.target.value)}
                    placeholder={scopeForNewAccount === 'personal' ? "Ex: Itaú, Nubank, Dinheiro" : "Ex: Conta PJ, Caixa Empresa"}
                    className="app-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Saldo Inicial (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newAccountBalance}
                    onChange={e => setNewAccountBalance(e.target.value)}
                    className="app-input"
                  />
                </div>
                <button type="submit" className="app-button-gold w-full mt-4 py-3">
                  Criar Conta
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
        active ? "bg-brand-gold text-brand-blue shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn("transition-transform duration-200", active && "scale-110")}>
        {icon}
      </div>
      {!collapsed && (
        <span className={cn("font-medium tracking-wide", active ? "font-bold" : "")}>
          {label}
        </span>
      )}
      {active && !collapsed && (
        <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue" />
      )}
    </button>
  );
}

function SubItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
        active ? "bg-brand-gold text-brand-blue font-bold shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AccountSidebarItem({ account, active, onClick, collapsed }: { account: Account, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 group",
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div 
        className="w-2 h-2 rounded-full shrink-0" 
        style={{ backgroundColor: account.color }} 
      />
      {!collapsed && (
        <span className={cn("text-sm transition-all truncate", active ? "font-bold" : "font-medium")}>
          {account.name}
        </span>
      )}
      {active && !collapsed && (
        <div className="ml-auto">
          <ChevronDown size={14} className="opacity-50" />
        </div>
      )}
    </button>
  );
}

function KpiCard({ title, value, icon, trend, color = 'brand' }: { title: string, value: number, icon: React.ReactNode, trend: 'up' | 'down', color?: string }) {
  return (
    <div className="app-card p-6 flex flex-col gap-2 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight text-brand-blue">
        {formatCurrency(value)}
      </div>
      <div className={cn(
        "text-xs font-bold flex items-center gap-1",
        trend === 'up' ? "text-emerald-600" : "text-rose-600"
      )}>
        {trend === 'up' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
        {trend === 'up' ? '+12%' : '-5%'} <span className="text-slate-400 font-normal">vs mês anterior</span>
      </div>
      <div className={cn(
        "absolute bottom-0 left-0 h-1 transition-all duration-500",
        color === 'emerald' ? "bg-emerald-500 w-full" : 
        color === 'rose' ? "bg-rose-500 w-full" : "bg-brand-gold w-full"
      )} />
    </div>
  );
}

function TransactionItem({ 
  transaction, 
  onDelete, 
  onEdit, 
  onToggleStatus 
}: { 
  transaction: Transaction, 
  onDelete: (id: string) => void, 
  onEdit?: (t: Transaction) => void,
  onToggleStatus?: (id: string) => void,
  key?: string 
}) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group TransactionItem_root">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          transaction.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}>
          {transaction.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800">{transaction.description}</h4>
            {onToggleStatus && (
              <button 
                onClick={() => onToggleStatus(transaction.id)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  transaction.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}
              >
                {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">{transaction.category}</span>
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={cn(
          "font-bold text-lg",
          transaction.type === 'income' ? "text-emerald-600" : "text-rose-600"
        )}>
          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print TransactionItem_actions">
          {onEdit && (
            <button 
              onClick={() => onEdit(transaction)}
              className="p-2 text-slate-300 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
              title="Editar"
            >
              <Pencil size={18} />
            </button>
          )}
          <button 
            onClick={() => onDelete(transaction.id)}
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

