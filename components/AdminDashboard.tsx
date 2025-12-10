import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { db } from '../services/db';
import { FeeStructure, PaymentRecord, Student, SchoolProfile, Expense, AppView } from '../types';
import { Users, DollarSign, AlertCircle, FileText, Wand2, TrendingUp, Wallet, ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Globe, Phone, Calendar, TrendingDown, ArrowDownRight, Clock } from 'lucide-react';
import { generateFinancialInsight } from '../services/geminiService';

// Animation Component for Numbers
const AnimatedNumber = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000; // 1s
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString()}</>;
};

interface AdminDashboardProps {
  onNavigate?: (view: AppView) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Expanded card states for interactivity
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<number | string | null>(null);

  const CATEGORIES = ['💸 Salaries', '💡 Utilities', '🔧 Maintenance', '📝 Supplies', '🎉 Events', '🏗️ Infrastructure', '🚌 Transport', '📦 Miscellaneous', '📚 Academics', '⚽ Sports'];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    const currentProfile = db.getSchoolProfile();
    setProfile(currentProfile);
    
    // Filter data by current session
    const session = currentProfile.currentSession;
    setStudents(db.getStudents().filter(s => s.session === session));
    setPayments(db.getPayments().filter(p => p.session === session));
    setFees(db.getFees().filter(f => f.session === session));
    setExpenses(db.getExpenses().filter(e => e.session === session));
  }, []);

  const defaultSliderImages = [
    {
      id: '1',
      url: "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Empowering Future Leaders",
      subtitle: "Excellence in Education Since 1995"
    }
  ];

  const sliderImages = profile?.sliderImages && profile.sliderImages.length > 0 
    ? profile.sliderImages 
    : defaultSliderImages;

  useEffect(() => {
    if (sliderImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

  // Helper to calculate student's payment percentage
  const getStudentPercentage = (studentId: string) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return 0;
      
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
      
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const paid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      
      return total > 0 ? (paid / total) * 100 : 0;
  };

  // Styles Helper for Fees Cards
  const getCardStyles = (percentage: number) => {
      if (percentage >= 100) return {
          card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800",
          iconBg: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
          badge: "bg-blue-100/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          text: "text-blue-900 dark:text-blue-100",
          subtext: "text-blue-700 dark:text-blue-300"
      };
      if (percentage >= 80) return {
          card: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800",
          iconBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
          badge: "bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-900 dark:text-emerald-100",
          subtext: "text-emerald-700 dark:text-emerald-300"
      };
      if (percentage >= 60) return {
          card: "bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-green-200 dark:border-green-800",
          iconBg: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700",
          badge: "bg-green-100/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
          text: "text-green-900 dark:text-green-100",
          subtext: "text-green-700 dark:text-green-300"
      };
      if (percentage >= 40) return {
          card: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800",
          iconBg: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
          badge: "bg-yellow-100/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-900 dark:text-yellow-100",
          subtext: "text-yellow-700 dark:text-yellow-300"
      };
      if (percentage >= 20) return {
          card: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800",
          iconBg: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700",
          badge: "bg-orange-100/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
          text: "text-orange-900 dark:text-orange-100",
          subtext: "text-orange-700 dark:text-orange-300"
      };
      return {
          card: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800",
          iconBg: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
          badge: "bg-red-100/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
          text: "text-red-900 dark:text-red-100",
          subtext: "text-red-700 dark:text-red-300"
      };
  };

  // Styles Helper for Expense Cards
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
           card: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700",
          badge: "bg-purple-100/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          text: "text-purple-900 dark:text-purple-100",
          subtext: "text-purple-700 dark:text-purple-300"
      };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = students.length;
    let totalExpected = 0;
    let totalCollected = 0;

    // Get today's date in YYYY-MM-DD format based on local time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Calculate Totals and Today's values
    let collectedToday = 0;
    
    students.forEach(student => {
      student.feeStructureIds.forEach(feeId => {
        const fee = fees.find(f => f.id === feeId);
        if (fee) totalExpected += fee.amount;
      });
    });

    payments.forEach(p => {
      totalCollected += p.amountPaid;
      if (p.date === today) {
        collectedToday += p.amountPaid;
      }
    });

    const totalPending = totalExpected - totalCollected;
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    // Calculate Expenses
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const expensesToday = expenses
        .filter(e => e.date === today)
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate Profit/Loss
    const profitLoss = totalCollected - totalExpenses;
    const profitLossToday = collectedToday - expensesToday;

    // Calculate Due Today (Pending amount for fees that have a deadline of today)
    let dueToday = 0;
    students.forEach(s => {
        s.feeStructureIds.forEach(fid => {
            const fee = fees.find(f => f.id === fid);
            if (fee && fee.dueDate === today) {
                const paidForFee = payments
                    .filter(p => p.studentId === s.id && p.feeStructureId === fid)
                    .reduce((sum, p) => sum + p.amountPaid, 0);
                dueToday += Math.max(0, fee.amount - paidForFee);
            }
        });
    });

    // Chart Data: Monthly Collection
    const monthlyMap = new Map<string, number>();
    payments.forEach(p => {
      const month = new Date(p.date).toLocaleString('default', { month: 'short' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + p.amountPaid);
    });
    
    const monthlyData = Array.from(monthlyMap.entries()).map(([name, amount]) => ({ name, amount }));

    // Chart Data: Class Distribution
    const classMap = new Map<string, number>();
    students.forEach(s => {
      const grade = s.grade || 'Unknown';
      classMap.set(grade, (classMap.get(grade) || 0) + 1);
    });
    const classData = Array.from(classMap.entries()).map(([name, value]) => ({ name, value }));

    // Find Last Payment
    const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : null;

    // Find Last Expense
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

    return { 
        totalStudents, 
        totalCollected, 
        totalPending, 
        totalExpenses, 
        profitLoss, 
        collectionRate, 
        monthlyData, 
        classData,
        collectedToday,
        expensesToday,
        dueToday,
        profitLossToday,
        lastPayment,
        lastExpense
    };
  }, [students, payments, fees, expenses]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const text = await generateFinancialInsight(stats.totalCollected, stats.totalPending, students);
    setInsight(text);
    setLoadingInsight(false);
  };

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [payments]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [expenses]);


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. SCHOOL PROFILE CARD (DASHBOARD WIDGET) */}
      {profile && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-0 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 h-48 md:h-auto relative bg-indigo-900">
               {profile.backgroundImage && (
                  <>
                     <img src={profile.backgroundImage} alt="Campus" className="w-full h-full object-cover opacity-50" />
                     <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-transparent to-transparent"></div>
                  </>
               )}
               <div className="absolute bottom-6 left-6 flex items-end gap-4 z-10">
                   <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-lg">
                       <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                           {profile.logo ? (
                               <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
                           ) : (
                               <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{profile.name.charAt(0)}</span>
                           )}
                       </div>
                   </div>
                   <div className="text-white mb-1">
                       <h2 className="text-xl font-bold leading-tight">{profile.name}</h2>
                       <p className="text-indigo-200 text-sm">{profile.tagline}</p>
                   </div>
               </div>
            </div>
            
            <div className="w-full md:w-2/3 p-6 flex flex-col justify-center">
                 <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Current Session</p>
                            <p className="font-bold text-gray-900 dark:text-white">{profile.currentSession}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Location</p>
                            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{profile.address}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Contact</p>
                            <p className="font-bold text-gray-900 dark:text-white">{profile.phone}</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Globe className="w-4 h-4" />
                          <a href={`https://${profile.website}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              {profile.website}
                          </a>
                      </div>
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          Verified Campus
                      </span>
                 </div>
            </div>
        </div>
      )}

      {/* 2. IMAGE SLIDER (CAROUSEL) */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg group">
        {sliderImages.length > 0 && sliderImages.map((slide, index) => (
          <div 
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img 
              src={slide.url} 
              alt={slide.title} 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[10s]"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white text-center p-4">
               <h2 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight animate-in slide-in-from-bottom-4 duration-700">{slide.title}</h2>
               <p className="text-lg md:text-xl text-white/90 font-light animate-in slide-in-from-bottom-6 duration-1000 delay-100">{slide.subtitle}</p>
            </div>
          </div>
        ))}
        
        {/* Slider Controls */}
        {sliderImages.length > 1 && (
            <>
                <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {sliderImages.map((_, index) => (
                    <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
                </div>
            </>
        )}
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-gray-200 dark:border-gray-700 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🚀 Executive Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Financial overview & student insights for Session {profile?.currentSession}</p>
        </div>
        <button 
          onClick={handleGenerateInsight}
          disabled={loadingInsight}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-all duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loadingInsight ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          <span>{loadingInsight ? "Analyzing Data..." : "✨ Generate AI Insight"}</span>
          <div className="absolute inset-0 rounded-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
        </button>
      </div>

      {insight && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800 p-6 rounded-2xl shadow-sm">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wand2 className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
           </div>
           <div className="relative z-10">
              <h3 className="text-indigo-900 dark:text-indigo-200 font-bold mb-2 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 🤖 Executive Summary
              </h3>
              <p className="text-indigo-800 dark:text-indigo-100 leading-relaxed max-w-3xl">{insight}</p>
           </div>
        </div>
      )}

      {/* Stats Grid - Modern Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Total Collected Fees */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Collected Fees</span>
                </div>
                {stats.lastPayment && (
                    <div className="text-right z-20">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">Last Entry</p>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-black/20 px-1.5 rounded">₹{stats.lastPayment.amountPaid.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{stats.lastPayment.date}</span>
                        </div>
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
               <AnimatedNumber value={stats.totalCollected} prefix="₹" />
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm font-medium mt-3 flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg w-fit">
              <Clock className="w-3.5 h-3.5" /> 
              <span>Today: ₹{stats.collectedToday.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* 2. Total Due Fees */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Fees</span>
            </div>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
                <AnimatedNumber value={stats.totalPending} prefix="₹" />
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm font-medium mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg w-fit">
              <Clock className="w-3.5 h-3.5" /> 
              <span>Due Today: ₹{stats.dueToday.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* 3. Total Expenses */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</span>
                </div>
                {stats.lastExpense && (
                    <div className="text-right z-20">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">Last Entry</p>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-black/20 px-1.5 rounded">₹{stats.lastExpense.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{stats.lastExpense.date}</span>
                        </div>
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={stats.totalExpenses} prefix="₹" />
            </h3>
            <p className="text-rose-700 dark:text-rose-300 text-sm font-medium mt-3 flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg w-fit">
              <Clock className="w-3.5 h-3.5" /> 
              <span>Today: ₹{stats.expensesToday.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* 4. Total Profit/Loss */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${stats.profitLoss >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${stats.profitLoss >= 0 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                {stats.profitLoss >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net Profit/Loss</span>
            </div>
            <h3 className={`text-3xl font-bold ${stats.profitLoss >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
                <AnimatedNumber value={stats.profitLoss} prefix="₹" />
            </h3>
            <p className={`text-sm font-medium mt-3 flex items-center gap-2 px-2 py-1 rounded-lg w-fit ${stats.profitLossToday >= 0 ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Today: {stats.profitLossToday >= 0 ? '+' : ''}₹{stats.profitLossToday.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">📊 Revenue Analytics</h3>
             <select className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500">
               <option>This Year</option>
               <option>Last Year</option>
             </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">📚 Class Distribution</h3>
          <div className="flex-1 min-h-[250px] relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.classData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.classData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{color: '#94a3b8'}} />
              </PieChart>
            </ResponsiveContainer>
             {/* Center Text overlay for Pie Chart */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-800 dark:text-white">{stats.totalStudents}</span>
                    <span className="text-xs text-gray-400 uppercase">Students</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* New History Cards Section: Fees & Expenses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        
        {/* Recent Fee Payments Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
             <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" /> 
                    <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                        Recent Fee Payments
                    </span>
                </h3>
                <button 
                    onClick={() => onNavigate?.(AppView.FEES_MANAGER)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    View All
                </button>
            </div>
            
            <div className="space-y-3">
                {sortedPayments.length > 0 ? sortedPayments.map(payment => {
                    const student = students.find(s => s.id === payment.studentId);
                    const fee = fees.find(f => f.id === payment.feeStructureId);
                    const percentage = student ? getStudentPercentage(student.id) : 0;
                    const styles = getCardStyles(percentage);
                    const isExpanded = expandedPaymentId === payment.id;
                    
                    return (
                        <div 
                            key={payment.id} 
                            onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                            className={`group rounded-xl p-3 border transition-all duration-300 relative overflow-hidden cursor-pointer 
                                ${styles.card} 
                                ${isExpanded ? 'shadow-md ring-2 ring-indigo-400/50 scale-[1.01]' : 'hover:shadow-sm'}
                            `}
                        >
                             <div className="flex justify-between items-start mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium font-mono border ${styles.badge}`}>
                                    #{payment.id.slice(-6)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles.subtext}`}>
                                    <Clock className="w-3 h-3" /> {payment.date}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm border ${styles.iconBg} text-xs`}>
                                    {student?.name.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-bold truncate text-sm ${styles.text}`}>
                                        {student?.name || 'Unknown'}
                                    </h4>
                                    <p className={`text-[10px] truncate ${styles.subtext}`}>
                                        ID: {student?.id} • Class {student?.grade}
                                    </p>
                                </div>
                            </div>
                            
                            <div className={`pt-2 border-t flex items-end justify-between border-current/10`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${styles.subtext}`}>Paid For</p>
                                    <p className={`text-xs font-semibold truncate max-w-[150px] ${styles.text}`}>
                                        {fee?.name || 'Fee'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                    +₹{payment.amountPaid.toLocaleString()}
                                    </p>
                                    <span className={`text-[10px] px-1.5 py-0 rounded border capitalize ${styles.badge}`}>
                                    {payment.method.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                        No recent payments found.
                    </div>
                )}
            </div>
        </div>

        {/* Recent Expenses Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
             <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" /> 
                    <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                        Recent Expenses
                    </span>
                </h3>
                <button 
                    onClick={() => onNavigate?.(AppView.EXPENSES)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    View All
                </button>
            </div>

            <div className="space-y-3">
                {sortedExpenses.length > 0 ? sortedExpenses.map(expense => {
                    const styles = getCategoryStyle(expense.category);
                    const isExpanded = expandedExpenseId === expense.id;

                    return (
                        <div 
                            key={expense.id} 
                            onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                            className={`group rounded-xl p-3 border transition-all duration-300 relative overflow-hidden cursor-pointer 
                                ${styles.card} 
                                ${isExpanded ? 'shadow-md ring-2 ring-indigo-400/50 scale-[1.01]' : 'hover:shadow-sm'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium font-mono border ${styles.badge}`}>
                                    #{expense.id.toString().slice(-6)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles.subtext}`}>
                                    <Calendar className="w-3 h-3" /> {expense.date}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm border ${styles.iconBg} text-xs`}>
                                    {expense.category.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-bold truncate text-sm ${styles.text}`}>
                                        {expense.category}
                                    </h4>
                                    {expense.description && (
                                        <p className={`text-[10px] truncate font-medium opacity-80 ${styles.text}`}>
                                            {expense.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className={`pt-2 border-t flex items-end justify-between border-current/10`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${styles.subtext}`}>Details</p>
                                    <p className={`text-xs font-semibold truncate max-w-[150px] ${styles.text}`}>
                                        Recorded on {expense.date}
                                    </p>
                                </div>
                                <div className="text-right">
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                        -₹{expense.amount.toLocaleString()}
                                        </p>
                                        <span className={`text-[10px] px-1.5 py-0 rounded border capitalize ${styles.badge}`}>
                                        Debit
                                        </span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                        No recent expenses found.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;