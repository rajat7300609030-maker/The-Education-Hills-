
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    TrendingDown, Calendar, Save, Bell, Moon, Database, RefreshCw, AlertCircle, Edit2, X, Trash2, Plus, Camera, Image as ImageIcon, Settings, Check, CheckCircle2, AlertTriangle, Sun, ArrowRight, ChevronDown, 
    Search, ChevronUp, History, Filter, DollarSign, TrendingUp, FileText, CreditCard, Edit, Eye, ShieldCheck, Upload, Layout, Recycle, RotateCcw, Download,
    ArrowLeft, User, CheckCircle, Wand2, Lock, Copy, Power
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { db } from '../services/db';
import { SchoolProfile, Expense, SliderImage, TrashItem, UserRole } from '../types';
import { useNotification } from './NotificationProvider';

// --- EXPENSES VIEW ---
interface ExpensesViewProps {
    userRole?: UserRole;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ userRole = UserRole.ADMIN }) => {
    const { showNotification } = useNotification();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [currentSession, setCurrentSession] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    // Delete Confirmation State
    const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState<number | string | null>(null);

    // Filter States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);
    const [expandedExpenseId, setExpandedExpenseId] = useState<number | string | null>(null);

    const CATEGORIES = ['💸 Salaries', '💡 Utilities', '🔧 Maintenance', '📝 Supplies', '🎉 Events', '🏗️ Infrastructure', '🚌 Transport', '📦 Miscellaneous', '📚 Academics', '⚽ Sports'];
    
    useEffect(() => {
        const session = db.getSchoolProfile().currentSession;
        setCurrentSession(session);
        setExpenses(db.getExpenses().filter(e => e.session === session));
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.amount || !form.date) return;

        if (selectedExpense) {
            const updated: Expense = {
                ...selectedExpense,
                category: form.category,
                description: form.description,
                amount: parseFloat(form.amount),
                date: form.date,
                session: currentSession
            };
            db.updateExpense(updated);
            showNotification('Expense updated successfully', 'success');
        } else {
            const newExpense: Expense = {
                id: Date.now(),
                category: form.category,
                description: form.description,
                amount: parseFloat(form.amount),
                date: form.date,
                session: currentSession
            };
            db.addExpense(newExpense);
            showNotification('Expense recorded successfully', 'success');
        }

        setExpenses(db.getExpenses().filter(e => e.session === currentSession));
        setIsModalOpen(false);
        setSelectedExpense(null);
        setForm({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setForm({
            category: expense.category,
            description: expense.description || '',
            amount: expense.amount.toString(),
            date: expense.date
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number | string) => {
        setExpenseToDeleteId(id);
        setIsDeleteExpenseModalOpen(true);
    };

    const confirmDelete = () => {
        if (expenseToDeleteId) {
            db.deleteExpense(expenseToDeleteId);
            setExpenses(db.getExpenses().filter(e => e.session === currentSession));
            showNotification('Expense moved to Recycle Bin', 'success');
            setIsDeleteExpenseModalOpen(false);
            setExpenseToDeleteId(null);
        }
    };

    // Filter Logic
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            // Date filtering
            const expenseDate = new Date(expense.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && expenseDate < start) return false;
            if (end) {
                end.setHours(23, 59, 59, 999); 
                if (expenseDate > end) return false;
            }

            // Category Filtering
            if (selectedCategory !== 'ALL' && expense.category !== selectedCategory) return false;

            // Search filtering
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesCategory = expense.category.toLowerCase().includes(searchLower);
                const matchesDescription = expense.description?.toLowerCase().includes(searchLower);
                const matchesId = expense.id.toString().toLowerCase().includes(searchLower);
                if (!matchesCategory && !matchesId && !matchesDescription) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, startDate, endDate, searchTerm, selectedCategory]);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const historyStats = {
        total: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: filteredExpenses.length,
        todayAmount: filteredExpenses.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((sum, e) => sum + e.amount, 0)
    };

    const chartData = Object.entries(expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

    const getCategoryStyle = (category: string) => {
        const index = CATEGORIES.indexOf(category);
        const colorBase = index % 5; 

        if (colorBase === 0) return {
            card: "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800",
            iconBg: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700",
            badge: "bg-indigo-100/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
            text: "text-indigo-900 dark:text-indigo-100",
            subtext: "text-indigo-700 dark:text-indigo-300"
        };
        if (colorBase === 1) return {
             card: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
            badge: "bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
            text: "text-emerald-900 dark:text-emerald-100",
            subtext: "text-emerald-700 dark:text-emerald-300"
        };
        if (colorBase === 2) return {
             card: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800",
            iconBg: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700",
            badge: "bg-rose-100/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
            text: "text-rose-900 dark:text-rose-100",
            subtext: "text-rose-700 dark:text-rose-300"
        };
        if (colorBase === 3) return {
             card: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800",
            iconBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700",
            badge: "bg-amber-100/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
            text: "text-amber-900 dark:text-amber-100",
            subtext: "text-amber-700 dark:text-amber-300"
        };
        return {
             card: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800",
            iconBg: "bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
            badge: "bg-gray-100/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
            text: "text-gray-900 dark:text-gray-100",
            subtext: "text-gray-700 dark:text-gray-300"
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                 <div>
                     <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        💸 Expenses
                     </h1>
                     <p className="text-gray-500 dark:text-gray-400 mt-1">
                        📊 Monitor and control school operational expenditure 💸 for Session <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentSession}</span>
                     </p>
                </div>
                {userRole === UserRole.ADMIN && (
                    <button 
                        onClick={() => {
                            setSelectedExpense(null);
                            setForm({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ring-4 ring-indigo-50 dark:ring-indigo-900/20"
                    >
                        <Plus className="w-5 h-5" /> Record Expense
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ... Stats Cards ... */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <TrendingDown className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Total Outflow</span>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">₹{totalExpenses.toLocaleString()}</h2>
                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-full text-white/90">
                             <span>{expenses.length} Transactions Recorded</span>
                        </div>
                     </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                     <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3 text-gray-500 dark:text-gray-400">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">Highest Spend</span>
                            </div>
                            {chartData.length > 0 ? (() => {
                                const top = chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
                                return (
                                    <>
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white truncate" title={top.name}>{top.name}</h2>
                                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mt-1">₹{top.value.toLocaleString()}</p>
                                    </>
                                );
                            })() : (
                                <p className="text-gray-400 italic">No data available</p>
                            )}
                        </div>
                     </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                     <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3 text-gray-500 dark:text-gray-400">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">Average / Txn</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₹{expenses.length ? Math.round(totalExpenses / expenses.length).toLocaleString() : 0}
                            </h2>
                            <p className="text-xs text-gray-400 mt-2">Based on {expenses.length} records</p>
                        </div>
                     </div>
                </div>
            </div>

             {/* History Section */}
             <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="cursor-pointer flex-1" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-400" /> Expense History
                            </h2>
                            <p className="text-sm text-gray-300 mt-1">Track all operational expenses and financial outflows</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className={`flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 w-full md:w-auto transition-all duration-300 ${!isHistoryVisible ? 'opacity-50 pointer-events-none hidden md:flex' : ''}`}>
                                <input type="date" className="w-full md:w-32 pl-4 pr-2 py-1.5 bg-transparent text-xs font-medium text-white focus:outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!isHistoryVisible} />
                                <span className="text-gray-400">to</span>
                                <input type="date" className="w-full md:w-32 pl-4 pr-2 py-1.5 bg-transparent text-xs font-medium text-white focus:outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={!isHistoryVisible} />
                            </div>

                            <div className={`relative flex-1 md:flex-none w-full md:w-48 transition-all duration-300 ${!isHistoryVisible ? 'opacity-50 pointer-events-none hidden md:block' : ''}`}>
                                <select className="w-full pl-4 pr-8 py-2 bg-white/10 border border-white/10 rounded-xl text-sm focus:outline-none text-white appearance-none cursor-pointer" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={!isHistoryVisible}>
                                    <option value="ALL" className="bg-gray-800 text-white">All Categories</option>
                                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-800 text-white">{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className={`relative flex-1 md:flex-none w-full md:w-64 transition-all duration-300 ${!isHistoryVisible ? 'opacity-50 pointer-events-none hidden md:block' : ''}`}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search Expense..." className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm focus:outline-none text-white placeholder-gray-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!isHistoryVisible} />
                            </div>
                            
                            <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all backdrop-blur-sm shadow-sm text-white flex-shrink-0">
                                {isHistoryVisible ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>

                    <div className={`relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${isHistoryVisible ? 'max-h-[500px] opacity-100 mt-6 pt-6 border-t border-gray-700/50' : 'max-h-0 opacity-0 border-none'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400"><DollarSign className="w-5 h-5" /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Total (Filtered)</p><p className="text-xl font-bold text-white tracking-tight">₹{historyStats.total.toLocaleString()}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400"><TrendingUp className="w-5 h-5" /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Today's Expenses</p><p className="text-xl font-bold text-white tracking-tight">₹{historyStats.todayAmount.toLocaleString()}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><FileText className="w-5 h-5" /></div>
                                <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Transactions</p><p className="text-xl font-bold text-white tracking-tight">{historyStats.count}</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isHistoryVisible ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {filteredExpenses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredExpenses.map((expense) => {
                                const styles = getCategoryStyle(expense.category);
                                const isExpanded = expandedExpenseId === expense.id;
                                
                                return (
                                    <div 
                                        key={expense.id} 
                                        onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                                        className={`group rounded-xl p-4 border transition-all duration-300 relative overflow-hidden cursor-pointer 
                                            ${styles.card} 
                                            ${isExpanded ? 'shadow-lg ring-2 ring-indigo-400/50 scale-[1.02] z-10' : 'hover:shadow-md'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium font-mono border ${styles.badge}`}>
                                                #{expense.id.toString().slice(-6)}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles.subtext}`}>
                                                <Calendar className="w-3 h-3" /> {expense.date}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm border-2 ${styles.iconBg}`}>
                                                    {expense.category.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold truncate ${styles.text}`} title={expense.category}>{expense.category}</h4>
                                                    {expense.description && (<p className={`text-xs truncate font-medium opacity-80 ${styles.text}`}>{expense.description}</p>)}
                                                </div>
                                            </div>
                                            
                                        </div>
                                        
                                        <div className="flex justify-end pt-2 border-t border-current/10 w-full mb-1">
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400">-₹{expense.amount.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {userRole === UserRole.ADMIN && (
                                            <div className={`flex items-center justify-center gap-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top overflow-hidden ${isExpanded ? 'max-h-40 opacity-100 pt-4 pb-2' : 'max-h-0 opacity-0 py-0'}`}>
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(expense); }} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"><Edit className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-500 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No expenses found.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/50 dark:border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {selectedExpense ? '✏️ Edit Expense' : '✨ New Expense'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">🏷️ Category</label>
                                <select required className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📝 Description</label>
                                <input required type="text" className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Expense details..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">💰 Amount</label>
                                <input required type="number" min="0" className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📅 Date</label>
                                <input required type="date" className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]">
                                ✅ Save Record
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Expense Confirmation Modal */}
            {isDeleteExpenseModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Expense?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this expense? <br/>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">This item will be moved to the Recycle Bin.</span>
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDeleteExpenseModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SCHOOL PROFILE VIEW ---
interface SchoolProfileViewProps {
    onNavigateToDashboard?: () => void;
    userRole?: UserRole;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({ onNavigateToDashboard, userRole = UserRole.ADMIN }) => {
    const { showNotification } = useNotification();
    const [profile, setProfile] = useState<SchoolProfile>(db.getSchoolProfile());
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<SchoolProfile>(db.getSchoolProfile());
    
    // File Inputs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    // Terms Edit State
    const [isEditingTerms, setIsEditingTerms] = useState(false);
    const [termsText, setTermsText] = useState('');

    // Session Management State
    const [newSession, setNewSession] = useState('');
    const [isEditingSessionId, setIsEditingSessionId] = useState<string | null>(null);
    const [editSessionValue, setEditSessionValue] = useState('');

    // Delete Session Confirmation State
    const [isDeleteSessionModalOpen, setIsDeleteSessionModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    // Change Session States
    const [isChangeSessionModalOpen, setIsChangeSessionModalOpen] = useState(false);
    const [sessionToActivate, setSessionToActivate] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Slider State
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
    const [isAddingSlide, setIsAddingSlide] = useState(false);
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [newSlide, setNewSlide] = useState<{title: string, subtitle: string, url: string}>({ title: '', subtitle: '', url: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete Confirmation State
    const [isDeleteSlideModalOpen, setIsDeleteSlideModalOpen] = useState(false);
    const [slideToDelete, setSlideToDelete] = useState<string | null>(null);

    useEffect(() => {
        const p = db.getSchoolProfile();
        setProfile(p);
        setFormData(p);
        setTermsText(p.feesReceiptTerms || '');
        setSliderImages(p.sliderImages || []);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        db.updateSchoolProfile(formData);
        setProfile(formData);
        setIsEditing(false);
        showNotification('School profile updated', 'success');
        // Dispatch event to notify sidebar
        window.dispatchEvent(new Event('schoolProfileUpdated'));
    };

    const handleSaveTerms = () => {
        const updated = { ...profile, feesReceiptTerms: termsText };
        db.updateSchoolProfile(updated);
        setProfile(updated);
        setIsEditingTerms(false);
        showNotification('Terms & Conditions updated', 'success');
        window.dispatchEvent(new Event('schoolProfileUpdated'));
    };

    const handleDeleteSlide = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSlideToDelete(id);
        setIsDeleteSlideModalOpen(true);
    };

    const confirmDeleteSlide = () => {
        if (slideToDelete) {
            const updatedImages = sliderImages.filter(img => img.id !== slideToDelete);
            setSliderImages(updatedImages);
            const updatedProfile = { ...profile, sliderImages: updatedImages };
            db.updateSchoolProfile(updatedProfile);
            setProfile(updatedProfile);
            showNotification('Slide deleted successfully', 'success');
            setIsDeleteSlideModalOpen(false);
            setSlideToDelete(null);
            window.dispatchEvent(new Event('schoolProfileUpdated'));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewSlide(prev => ({ ...prev, url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'backgroundImage') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditSlide = (e: React.MouseEvent, slide: SliderImage) => {
        e.preventDefault();
        e.stopPropagation();
        setNewSlide({
            title: slide.title,
            subtitle: slide.subtitle,
            url: slide.url
        });
        setEditingSlideId(slide.id);
        setIsAddingSlide(true);
    };

    const closeSlideModal = () => {
        setIsAddingSlide(false);
        setNewSlide({ title: '', subtitle: '', url: '' });
        setEditingSlideId(null);
    }

    const handleAddSlide = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSlide.url) return alert("Please upload an image");
        
        let updatedImages = [...sliderImages];

        if (editingSlideId) {
            // Update existing
            updatedImages = updatedImages.map(img => 
                img.id === editingSlideId 
                    ? { ...img, title: newSlide.title, subtitle: newSlide.subtitle, url: newSlide.url }
                    : img
            );
            showNotification('Slide updated successfully', 'success');
        } else {
            // Add new
            const newImage: SliderImage = {
                id: Date.now().toString(),
                url: newSlide.url,
                title: newSlide.title || 'New Slide',
                subtitle: newSlide.subtitle || ''
            };
            updatedImages.push(newImage);
            showNotification('New slide added', 'success');
        }
        
        setSliderImages(updatedImages);
        const updatedProfile = { ...profile, sliderImages: updatedImages };
        db.updateSchoolProfile(updatedProfile);
        setProfile(updatedProfile);
        window.dispatchEvent(new Event('schoolProfileUpdated'));
        closeSlideModal();
    };

    // --- SESSION MANAGEMENT LOGIC ---

    const handleAddSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSession.trim() && !profile.sessions.includes(newSession.trim())) {
            const updatedSessions = [...profile.sessions, newSession.trim()].sort().reverse();
            const updatedProfile = { ...profile, sessions: updatedSessions };
            db.updateSchoolProfile(updatedProfile);
            setProfile(updatedProfile);
            setNewSession('');
            showNotification(`Session ${newSession} added`, 'success');
            window.dispatchEvent(new Event('schoolProfileUpdated'));
        } else if (profile.sessions.includes(newSession.trim())) {
            showNotification('Session already exists', 'error');
        }
    };

    const handleAutoGenerateSession = () => {
        const lastSession = profile.sessions[0]; // Assuming reverse sort, latest is first
        const match = lastSession.match(/(\d{4}).*?(\d{4})/);
        let nextSession = "";
        
        if (match) {
            const start = parseInt(match[1]) + 1;
            const end = parseInt(match[2]) + 1;
            nextSession = `${start}-${end}`;
        } else {
            const yr = new Date().getFullYear();
            nextSession = `${yr}-${yr+1}`;
        }
        setNewSession(nextSession);
        showNotification("Next session auto-generated!", "info");
    };

    const handleEditSessionStart = (session: string) => {
        setIsEditingSessionId(session);
        setEditSessionValue(session);
    };

    const handleEditSessionSave = () => {
        if (!isEditingSessionId || !editSessionValue.trim()) {
            setIsEditingSessionId(null);
            return;
        }
        
        if (profile.sessions.includes(editSessionValue.trim()) && editSessionValue.trim() !== isEditingSessionId) {
            showNotification('Session name already exists', 'error');
            return;
        }

        const updatedSessions = profile.sessions.map(s => s === isEditingSessionId ? editSessionValue.trim() : s);
        // Also update current session if it was the one edited
        let updatedCurrent = profile.currentSession;
        if (profile.currentSession === isEditingSessionId) {
            updatedCurrent = editSessionValue.trim();
        }

        const updatedProfile = { ...profile, sessions: updatedSessions, currentSession: updatedCurrent };
        db.updateSchoolProfile(updatedProfile);
        setProfile(updatedProfile);
        setIsEditingSessionId(null);
        showNotification('Session renamed successfully', 'success');
        window.dispatchEvent(new Event('schoolProfileUpdated'));
    };

    const handleSetCurrentSession = (session: string) => {
        if (session === profile.currentSession) return;
        setSessionToActivate(session);
        setIsChangeSessionModalOpen(true);
    };

    const confirmChangeSession = () => {
        if (sessionToActivate) {
            const updatedProfile = { ...profile, currentSession: sessionToActivate };
            db.updateSchoolProfile(updatedProfile);
            setProfile(updatedProfile);
            window.dispatchEvent(new Event('schoolProfileUpdated'));
            
            setIsChangeSessionModalOpen(false);
            setIsSuccessModalOpen(true);
        }
    };

    const handleSuccessDismiss = () => {
        setIsSuccessModalOpen(false);
        setSessionToActivate(null);
        if (onNavigateToDashboard) {
            onNavigateToDashboard();
        }
    };

    const handleDeleteSession = (session: string) => {
        if (session === profile.currentSession) {
            showNotification("Cannot delete the active session", "error");
            return;
        }
        setSessionToDelete(session);
        setIsDeleteSessionModalOpen(true);
    };

    const confirmDeleteSession = () => {
        if (sessionToDelete) {
            // Check for linked data in this session
            const studentsInSession = db.getStudents().filter(s => s.session === sessionToDelete);
            const paymentsInSession = db.getPayments().filter(p => p.session === sessionToDelete);
            const feesInSession = db.getFees().filter(f => f.session === sessionToDelete);
            const expensesInSession = db.getExpenses().filter(e => e.session === sessionToDelete);

            const hasData = studentsInSession.length > 0 || paymentsInSession.length > 0 || feesInSession.length > 0 || expensesInSession.length > 0;

            if (hasData) {
                const details = [];
                if (studentsInSession.length > 0) details.push(`${studentsInSession.length} Students`);
                if (paymentsInSession.length > 0) details.push(`${paymentsInSession.length} Payments`);
                if (feesInSession.length > 0) details.push(`${feesInSession.length} Fee Structures`);
                if (expensesInSession.length > 0) details.push(`${expensesInSession.length} Expenses`);

                showNotification(`Cannot delete session. Found linked data: ${details.join(', ')}. Please delete these records first.`, "error");
                setIsDeleteSessionModalOpen(false);
                setSessionToDelete(null);
                return;
            }

            const updatedSessions = profile.sessions.filter(s => s !== sessionToDelete);
            const updatedProfile = { ...profile, sessions: updatedSessions };
            db.updateSchoolProfile(updatedProfile);
            setProfile(updatedProfile);
            showNotification(`Session ${sessionToDelete} deleted`, 'success');
            setIsDeleteSessionModalOpen(false);
            setSessionToDelete(null);
            window.dispatchEvent(new Event('schoolProfileUpdated'));
        }
    };

    const handleDuplicateSession = () => {
        showNotification("Session settings duplicated (Simulation)", "success");
    };

    const handleLockSession = () => {
        showNotification("Session locked successfully (Simulation)", "success");
    };

    const displayProfile = isEditing ? formData : profile;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={onNavigateToDashboard} className="p-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Profile & Configuration</h1>
            </div>

            {/* Main Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-40 bg-indigo-900 relative group">
                    {displayProfile.backgroundImage ? (
                        <img src={displayProfile.backgroundImage} alt="Banner" className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon className="w-12 h-12 text-white" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {isEditing && userRole === UserRole.ADMIN && (
                        <>
                            <button 
                                type="button"
                                onClick={() => backgroundInputRef.current?.click()}
                                className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all"
                            >
                                <Camera className="w-4 h-4" /> Change Cover
                            </button>
                            <input 
                                type="file" 
                                ref={backgroundInputRef} 
                                onChange={(e) => handleProfileImageUpload(e, 'backgroundImage')} 
                                className="hidden" 
                                accept="image/*" 
                            />
                        </>
                    )}

                    {userRole === UserRole.ADMIN && (
                        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/30 transition-colors flex items-center gap-2">
                            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />} {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                        </button>
                    )}
                </div>
                
                <div className="px-8 pb-8 relative">
                    <div className="-mt-16 mb-6 flex items-end gap-6">
                        <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-xl relative group">
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 relative">
                                {displayProfile.logo ? (
                                    <img src={displayProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-gray-400">LOGO</span>
                                )}
                                
                                {isEditing && userRole === UserRole.ADMIN && (
                                    <div 
                                        className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        <Camera className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[10px] text-white font-bold uppercase">Change</span>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={logoInputRef} 
                                onChange={(e) => handleProfileImageUpload(e, 'logo')} 
                                className="hidden" 
                                accept="image/*" 
                            />
                        </div>
                        <div className="mb-2 relative z-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{displayProfile.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{displayProfile.tagline}</p>
                        </div>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">🏫 School Name</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">✨ Tagline</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">📍 Address</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">🌐 Website</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">📞 Phone</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">📅 Current Session</label><input className="w-full text-gray-900 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.currentSession} onChange={e => setFormData({...formData, currentSession: e.target.value})} /></div>
                            </div>
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Save Changes</button>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                             <div>
                                <p className="text-gray-500 font-bold uppercase text-xs mb-1">📍 Address</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-200">{profile.address}</p>
                             </div>
                             <div>
                                <p className="text-gray-500 font-bold uppercase text-xs mb-1">📞 Contact & 🌐 Website</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-200">{profile.phone}</p>
                                <p className="text-indigo-600 dark:text-indigo-400">{profile.website}</p>
                             </div>
                             <div>
                                <p className="text-gray-500 font-bold uppercase text-xs mb-1">ℹ️ Details</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-200">📅 Session: {profile.currentSession}</p>
                                <p className="text-gray-600 dark:text-gray-400">📜 {profile.affiliation || 'Affiliation N/A'}</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard Slide Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">🖼️ Dashboard Slide Panel</h3>
                    {userRole === UserRole.ADMIN && (
                        <button onClick={() => setIsAddingSlide(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100"><Plus className="w-3 h-3" /> Add Slide</button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sliderImages.map(img => (
                        <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            {userRole === UserRole.ADMIN && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button type="button" onClick={(e) => handleEditSlide(e, img)} className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100" title="Edit Slide"><Edit className="w-4 h-4" /></button>
                                    <button type="button" onClick={(e) => handleDeleteSlide(e, img.id)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700" title="Delete Slide"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                                <p className="text-sm font-bold truncate">{img.title}</p>
                                <p className="text-[10px] opacity-80 truncate">{img.subtitle}</p>
                            </div>
                        </div>
                    ))}
                    {sliderImages.length === 0 && <p className="text-gray-500 italic text-sm">No slides added.</p>}
                </div>

                {isAddingSlide && userRole === UserRole.ADMIN && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md">
                            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">{editingSlideId ? 'Edit Slide' : 'Add New Slide'}</h3>
                            <form onSubmit={handleAddSlide} className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-500">Image</label><div className="flex gap-2"><input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" /><button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><Upload className="w-4 h-4 mx-auto" /> Upload</button></div></div>
                                {newSlide.url && <img src={newSlide.url} className="h-20 w-full object-cover rounded-lg" />}
                                <div><label className="text-xs font-bold text-gray-500">Title</label><input required className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500">Subtitle</label><input className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={newSlide.subtitle} onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})} /></div>
                                <div className="flex gap-2"><button type="button" onClick={closeSlideModal} className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700">Cancel</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">{editingSlideId ? 'Update Slide' : 'Add Slide'}</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Academic Session Management Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">📅 Academic Session Management</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Add New Session</h4>
                        {userRole === UserRole.ADMIN ? (
                            <>
                                <form onSubmit={handleAddSession} className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            className="w-full p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="e.g. 2025-2026"
                                            value={newSession}
                                            onChange={(e) => setNewSession(e.target.value)}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleAutoGenerateSession}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600"
                                            title="Auto-Generate Next Session"
                                        >
                                            <Wand2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </form>
                                <p className="text-xs text-gray-400 mt-2">Use the <Wand2 className="w-3 h-3 inline"/> magic button to auto-fill the next academic year.</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Only Admins can add new sessions.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Available Sessions</h4>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {profile.sessions.map(session => (
                                <div key={session} className={`group flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium ${session === profile.currentSession ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'}`}>
                                    <div className="flex items-center gap-2 flex-1">
                                        {isEditingSessionId === session && userRole === UserRole.ADMIN ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input 
                                                    className="w-full p-1 text-sm bg-white border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-500 dark:text-white"
                                                    value={editSessionValue}
                                                    onChange={(e) => setEditSessionValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={handleEditSessionSave} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setIsEditingSessionId(null)} className="p-1 text-red-500 hover:bg-red-100 rounded"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{session}</span>
                                                {session === profile.currentSession && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded ml-1 text-green-800 dark:text-green-100">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    
                                    {!isEditingSessionId && userRole === UserRole.ADMIN && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {session !== profile.currentSession && (
                                                <button 
                                                    onClick={() => handleSetCurrentSession(session)} 
                                                    className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Set as Active"
                                                >
                                                    Set Active
                                                </button>
                                            )}
                                            <button onClick={() => handleEditSessionStart(session)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded" title="Rename">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={handleDuplicateSession} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded" title="Duplicate Data">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={handleLockSession} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded" title="Lock Session">
                                                <Lock className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteSession(session)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fees Receipt Terms & Conditions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">📝 Fees Receipt Terms & Conditions</h3>
                     {userRole === UserRole.ADMIN && (
                        <button onClick={() => isEditingTerms ? handleSaveTerms() : setIsEditingTerms(true)} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${isEditingTerms ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {isEditingTerms ? <><Save className="w-3 h-3"/> Save Terms</> : <><Edit className="w-3 h-3"/> Edit Terms</>}
                        </button>
                     )}
                </div>
                {isEditingTerms && userRole === UserRole.ADMIN ? (
                    <textarea 
                        className="text-gray-900 w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm leading-relaxed" 
                        value={termsText}
                        onChange={(e) => setTermsText(e.target.value)}
                        placeholder="Enter terms and conditions displayed on receipts..."
                    />
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{profile.feesReceiptTerms || "No terms configured."}</pre>
                    </div>
                )}
            </div>

            {/* Delete Slide Confirmation Modal */}
            {isDeleteSlideModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Slide?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this slide? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDeleteSlideModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteSlide}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Session Confirmation Modal */}
            {isDeleteSessionModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Session?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete session <strong>{sessionToDelete}</strong>? <br/>
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">Warning: This might affect historical records linked to this session.</span>
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDeleteSessionModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteSession}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Session Confirmation Modal */}
            {isChangeSessionModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Session?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to switch the active session to <strong>{sessionToActivate}</strong>?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setIsChangeSessionModalOpen(false); setSessionToActivate(null); }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmChangeSession}
                                    className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Yes, Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Session changed successfully. Redirecting to Dashboard...
                            </p>
                            <button 
                                onClick={handleSuccessDismiss}
                                className="w-full px-4 py-3 text-white bg-green-600 rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SETTINGS VIEW ---
interface SettingsViewProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    userRole?: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, toggleDarkMode, userRole = UserRole.ADMIN }) => {
    const { showNotification } = useNotification();
    
    const handleResetData = () => {
        if(confirm("DANGER: This will wipe all data and reset to defaults. Are you sure?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleDownloadFeeReport = () => {
        const students = db.getStudents();
        const payments = db.getPayments();
        const fees = db.getFees();
        const currentSession = db.getSchoolProfile().currentSession;

        // Filter students by current session
        const sessionStudents = students.filter(s => s.session === currentSession);

        let html = `
            <html>
            <head>
                <title>Fee Report - ${currentSession}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .paid { color: green; font-weight: bold; }
                    .due { color: red; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Student Fee Report (${currentSession})</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Total Fees</th>
                            <th>Paid Amount</th>
                            <th>Due Amount</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sessionStudents.forEach(student => {
            let total = 0;
            if (student.totalClassFees && student.totalClassFees > 0) {
                total = student.totalClassFees;
            } else {
                student.feeStructureIds.forEach(fid => {
                    const fee = fees.find(f => f.id === fid);
                    if (fee) total += fee.amount;
                });
            }
            if (student.backFees) total += student.backFees;

            const paid = payments
                .filter(p => p.studentId === student.id)
                .reduce((acc, curr) => acc + curr.amountPaid, 0);
            
            const due = Math.max(0, total - paid);

            html += `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.grade}</td>
                    <td>₹${total.toLocaleString()}</td>
                    <td class="paid">₹${paid.toLocaleString()}</td>
                    <td class="due">₹${due.toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><Settings className="w-8 h-8 text-gray-400" /> System Settings</h1>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Appearance */}
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                     <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Sun className="w-5 h-5" /> Appearance</h3>
                     <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                         <div>
                             <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                             <p className="text-xs text-gray-500">Toggle application theme</p>
                         </div>
                         <button onClick={toggleDarkMode} className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                             <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${darkMode ? 'translate-x-6' : ''}`}></div>
                         </button>
                     </div>
                 </div>

                 {/* Data Management */}
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                     <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Database className="w-5 h-5" /> Data Management</h3>
                     <div className="space-y-3">
                         <button onClick={() => showNotification("Backup downloaded", "success")} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 flex items-center justify-center gap-2">
                             <Download className="w-4 h-4" /> Backup Data
                         </button>
                         <button onClick={handleDownloadFeeReport} className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 flex items-center justify-center gap-2">
                             <FileText className="w-4 h-4" /> Download Fee Report (PDF)
                         </button>
                         {userRole === UserRole.ADMIN && (
                            <button onClick={handleResetData} className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Reset Application
                            </button>
                         )}
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- RECYCLE BIN VIEW ---
interface RecycleBinViewProps {
    userRole?: UserRole;
}

export const RecycleBinView: React.FC<RecycleBinViewProps> = ({ userRole = UserRole.ADMIN }) => {
    const { showNotification } = useNotification();
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [selectedType, setSelectedType] = useState<'ALL' | 'STUDENT' | 'PAYMENT' | 'EXPENSE'>('ALL');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState<string | null>(null);

    useEffect(() => {
        setTrashItems(db.getTrash());
    }, []);

    const initiateRestore = (id: string) => {
        setItemToRestore(id);
        setIsRestoreModalOpen(true);
    };

    const confirmRestore = () => {
        if (itemToRestore) {
            if(db.restoreFromTrash(itemToRestore)) {
                setTrashItems(db.getTrash());
                showNotification("Item restored successfully", "success");
            } else {
                showNotification("Failed to restore item", "error");
            }
            setIsRestoreModalOpen(false);
            setItemToRestore(null);
        }
    };

    const initiatePermanentDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmPermanentDelete = () => {
        if (itemToDelete) {
            db.permanentDeleteTrashItem(itemToDelete);
            setTrashItems(db.getTrash());
            showNotification("Item permanently deleted", "success");
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const filteredItems = trashItems.filter(i => selectedType === 'ALL' || i.type === selectedType);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><Recycle className="w-8 h-8 text-orange-500" /> Recycle Bin</h1>
                 <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none text-gray-900 dark:text-white"
                >
                    <option value="ALL">All Items</option>
                    <option value="STUDENT">Students</option>
                    <option value="PAYMENT">Payments</option>
                    <option value="EXPENSE">Expenses</option>
                 </select>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                 {filteredItems.length > 0 ? (
                     <div className="divide-y divide-gray-100 dark:divide-gray-700">
                         {filteredItems.map(item => (
                             <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                 <div className="flex items-center gap-4">
                                     <div className={`p-3 rounded-xl ${item.type === 'STUDENT' ? 'bg-indigo-100 text-indigo-600' : item.type === 'PAYMENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                         {item.type === 'STUDENT' ? <User className="w-5 h-5" /> : item.type === 'PAYMENT' ? <CreditCard className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                     </div>
                                     <div>
                                         <p className="font-bold text-gray-900 dark:text-white">{item.description}</p>
                                         <p className="text-xs text-gray-500">Deleted: {new Date(item.deletedAt).toLocaleString()}</p>
                                     </div>
                                 </div>
                                 {userRole === UserRole.ADMIN && (
                                    <div className="flex gap-2">
                                        <button onClick={() => initiateRestore(item.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <RotateCcw className="w-4 h-4" /> Restore
                                        </button>
                                        <button onClick={() => initiatePermanentDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <Trash2 className="w-4 h-4" /> Delete Forever
                                        </button>
                                    </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="p-12 text-center text-gray-400">
                         <Recycle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                         <p>Recycle bin is empty.</p>
                     </div>
                 )}
             </div>

            {/* Restore Confirmation Modal */}
            {isRestoreModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RotateCcw className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Restore Item?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                This item will be moved back to its original location in the active database.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsRestoreModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmRestore}
                                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Restore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Permanently Delete?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                This action cannot be undone. The item will be removed from the database forever.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmPermanentDelete}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
