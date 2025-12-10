import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Student, User, FeeStructure, PaymentRecord } from '../types';
import { db } from '../services/db';

interface Props {
  user: User;
}

const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-blue-600';
    if (percentage >= 90) return 'bg-indigo-500';
    if (percentage >= 80) return 'bg-teal-500';
    if (percentage >= 70) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 50) return 'bg-lime-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-amber-500';
    if (percentage >= 20) return 'bg-orange-500';
    if (percentage >= 10) return 'bg-orange-600';
    return 'bg-red-600';
};

const StudentDashboard: React.FC<Props> = ({ user }) => {
  const student = user as Student; 
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [currentSession, setCurrentSession] = useState('');

  useEffect(() => {
    const session = db.getSchoolProfile().currentSession;
    setCurrentSession(session);
    setPayments(db.getPayments().filter(p => p.session === session));
    setFees(db.getFees().filter(f => f.session === session));
  }, []);

  const myPayments = payments.filter(p => p.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const myFees = student.feeStructureIds.map((fid, index) => {
    const fee = fees.find(f => f.id === fid);
    if (!fee) return null;

    let effectiveAmount = fee.amount;
    // Use custom total fee if set for the first fee structure
    if (student.totalClassFees && student.totalClassFees > 0 && index === 0) {
        effectiveAmount = student.totalClassFees;
    }

    const paid = myPayments.filter(p => p.feeStructureId === fid).reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = Math.max(0, effectiveAmount - paid);
    
    return { ...fee, amount: effectiveAmount, paid, remaining, status: remaining <= 0 ? 'PAID' : 'PENDING' };
  }).filter(Boolean);

  let totalDue = myFees.reduce((acc, f) => acc + (f?.remaining || 0), 0);
  
  if (student.backFees) {
      totalDue += student.backFees;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      <div className="relative overflow-hidden rounded-3xl bg-indigo-900 text-white shadow-2xl shadow-indigo-900/20">
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>

         <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">
                     🛡️ Student Portal • {currentSession}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Hi, {student.name.split(' ')[0]} 👋</h1>
                <p className="text-indigo-200">Grade {student.grade} • ID: {student.id}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-w-[280px]">
                <p className="text-indigo-200 text-sm font-medium mb-1">Total Outstanding Balance 💳</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">₹{totalDue.toLocaleString()}</span>
                    <span className="text-indigo-300 text-sm">INR</span>
                </div>
                {totalDue > 0 ? (
                    <button className="mt-6 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        Pay Now 🚀 <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="mt-6 w-full py-3 bg-green-500/20 text-green-100 font-bold rounded-xl border border-green-500/30 text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> All Paid 🎉
                    </div>
                )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 Current Fees 📝
            </h2>
          </div>
          
          <div className="grid gap-4">
            {myFees.length > 0 ? (
                myFees.map((fee: any) => {
                    const percentage = (fee.paid / fee.amount) * 100;
                    return (
                        <div key={fee.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2 ${fee.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {fee.status === 'PAID' ? '✅ PAID' : '⏳ PENDING'}
                                    </span>
                                    <h3 className="font-semibold text-gray-900">{fee.name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">₹{fee.amount.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600 font-medium">Paid: ₹{fee.paid}</span>
                                    <span className="text-gray-500">Due: {fee.dueDate}</span>
                                </div>
                                <div className="relative w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                {fee.remaining > 0 && (
                                    <p className="text-right text-xs font-semibold text-red-600">
                                        ₹{fee.remaining} remaining 😟
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    No fees found for this session.
                </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
             Recent Activity 📜
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {myPayments.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {myPayments.map(payment => {
                        const feeName = fees.find(f => f.id === payment.feeStructureId)?.name;
                        return (
                            <div key={payment.id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{feeName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{payment.date} • {payment.method === 'ONLINE' ? '🌐 Online' : '💵 Cash'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-green-600">+₹{payment.amountPaid}</span>
                                    <button className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                                        Receipt 📄 <Download className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="p-10 text-center text-gray-400">
                    <p>No payment history available 📭.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;