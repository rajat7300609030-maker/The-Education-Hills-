
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, MessageCircle, User, Users, MapPin, Mail, AlertCircle, AlertTriangle, CreditCard, FileText, History, ChevronDown, ChevronUp, Download, Clock, DollarSign, CheckCircle, X, Edit, Eye, Trash2, Share2, Save, BarChart3, TrendingUp, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { db } from '../services/db';
import { Student, PaymentRecord, FeeStructure } from '../types';

interface Props {
    studentId: string | null;
    onBack: () => void;
    onNavigateToFees?: (studentId: string) => void;
}

const ParentProfileView: React.FC<Props> = ({ studentId, onBack, onNavigateToFees }) => {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [fees, setFees] = useState<FeeStructure[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [currentSession, setCurrentSession] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    
    // UI States
    const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
    const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
    
    // Modal States
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    
    // Receipt Modal State
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

    // Edit/Delete States
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
    
    // Payment Form
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        feeId: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0]
    });

    const PAYMENT_METHODS = ['Cash', 'UPI', 'Online Transfer', 'Cheque'];

    useEffect(() => {
        const session = db.getSchoolProfile().currentSession;
        setCurrentSession(session);
        setPayments(db.getPayments().filter(p => p.session === session));
        setFees(db.getFees().filter(f => f.session === session));
        setStudents(db.getStudents());
    }, [refreshKey]);

    const student = useMemo(() => {
        if (!studentId) return null;
        return students.find(s => s.id === studentId);
    }, [studentId, students]);

    const children = useMemo(() => {
        if (!student || !currentSession) return [];
        const targetParent = (student.parentName || '').trim().toLowerCase();
        
        return students.filter(s => {
            const pName = (s.parentName || '').trim().toLowerCase();
            // Match parent name AND current session to ensure data consistency
            return pName === targetParent && s.session === currentSession;
        });
    }, [student, currentSession, students]);

    // Analytics Data Calculation
    const analyticsData = useMemo(() => {
        const stats = children.map(child => {
            let total = 0;
            if (child.totalClassFees && child.totalClassFees > 0) {
                total = child.totalClassFees;
            } else {
                child.feeStructureIds.forEach(fid => {
                    const fee = fees.find(f => f.id === fid);
                    if (fee) total += fee.amount;
                });
            }
            if (child.backFees) total += child.backFees;

            const childPayments = payments.filter(p => p.studentId === child.id);
            const paid = childPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);
            const due = Math.max(0, total - paid);

            return {
                name: child.name.split(' ')[0], // First name for chart brevity
                fullName: child.name,
                total,
                paid,
                due
            };
        });

        const overall = stats.reduce((acc, curr) => ({
            total: acc.total + curr.total,
            paid: acc.paid + curr.paid,
            due: acc.due + curr.due
        }), { total: 0, paid: 0, due: 0 });

        return { childStats: stats, overall };
    }, [children, fees, payments]);

    const allFamilyPayments = useMemo(() => {
        const childIds = children.map(c => c.id);
        return payments
            .filter(p => childIds.includes(p.studentId))
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) {
                    return dateB - dateA;
                }
                // Tie-breaker: ID descending to show latest added first if dates are same
                return (b.id || '').localeCompare(a.id || '');
            });
    }, [payments, children]);

    const pieData = [
        { name: 'Paid', value: analyticsData.overall.paid, color: '#10b981' },
        { name: 'Due', value: analyticsData.overall.due, color: '#ef4444' }
    ];

    if (!student) {
        return (
             <div className="flex flex-col items-center justify-center h-96 text-gray-500 animate-in fade-in">
                <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">Student profile not found</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    // Helper: Calculate Stats for a Child (Used for individual cards)
    const getChildStats = (child: Student) => {
        const stat = analyticsData.childStats.find(s => s.fullName === child.name);
        if (!stat) return { total: 0, paid: 0, due: 0, percentage: 0 };
        const percentage = stat.total > 0 ? (stat.paid / stat.total) * 100 : 0;
        return { ...stat, percentage };
    };

    // Helper: Get Card Styles (Same as Fees Manager)
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

    // Actions
    const handleCall = () => {
        window.location.href = `tel:${student.contact}`;
    };

    const handleWhatsApp = () => {
         const message = `Hello, this is regarding ${student.name}.`;
         window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const openPayModal = (child: Student) => {
        if (onNavigateToFees) {
            onNavigateToFees(child.id);
        } else {
            // Fallback (though prop is expected)
            setSelectedChild(child);
            setPaymentForm({
                amount: '',
                feeId: child.feeStructureIds.length > 0 ? child.feeStructureIds[0] : '',
                method: 'Cash',
                date: new Date().toISOString().split('T')[0]
            });
            setIsPayModalOpen(true);
            setSelectedPayment(null);
        }
    };

    const handleDeleteClick = (payment: PaymentRecord) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    };

    const confirmDeletePayment = () => {
        if(selectedPayment) {
            db.deletePayment(selectedPayment.id);
            setRefreshKey(prev => prev + 1);
            setIsDeletePaymentModalOpen(false);
            setSelectedPayment(null);
        }
    };

    const handleSavePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedChild && paymentForm.amount && paymentForm.feeId) {
            if (selectedPayment) {
                 const updated: PaymentRecord = {
                    ...selectedPayment,
                    studentId: selectedChild.id,
                    feeStructureId: paymentForm.feeId,
                    amountPaid: parseFloat(paymentForm.amount),
                    date: paymentForm.date,
                    method: paymentForm.method,
                    session: currentSession
                };
                db.updatePayment(updated);
            } else {
                const newPayment: PaymentRecord = {
                    id: `P${Date.now()}`,
                    studentId: selectedChild.id,
                    feeStructureId: paymentForm.feeId,
                    amountPaid: parseFloat(paymentForm.amount),
                    date: paymentForm.date,
                    method: paymentForm.method,
                    session: currentSession
                };
                db.addPayment(newPayment);
            }
            
            setRefreshKey(prev => prev + 1); 
            setIsPayModalOpen(false);
            setSelectedChild(null);
            setSelectedPayment(null);
        }
    };

    // Receipt Generation Handlers
    const handleSaveReceipt = async () => {
        if (!receiptRef.current) return;
        setIsGeneratingReceipt(true);
        try {
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
                alert("Image generation library not loaded.");
                return;
            }
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, scrollY: -window.scrollY });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Receipt_${selectedPayment?.id || 'Fee'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingReceipt(false);
        }
    };

     const handleShareReceipt = async () => {
        if (!receiptRef.current) return;
        setIsGeneratingReceipt(true);
        try {
            const html2canvas = (window as any).html2canvas;
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, scrollY: -window.scrollY });
            canvas.toBlob(async (blob: Blob | null) => {
                if (blob && navigator.share) {
                    const file = new File([blob], `Receipt.png`, { type: 'image/png' });
                    await navigator.share({
                        title: 'Fee Receipt',
                        text: `Payment Receipt for ${selectedPayment?.id}`,
                        files: [file]
                    });
                }
            });
        } catch (e) {
            console.warn("Sharing failed", e);
        } finally {
            setIsGeneratingReceipt(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             {/* Header */}
             <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parent / Guardian Profile</h1>
            </div>

            {/* Parent Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 relative">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>
                
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="-mt-12">
                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    {student.parentName?.charAt(0).toUpperCase() || 'P'}
                                </div>
                            </div>
                        </div>

                        {/* Info & Actions */}
                        <div className="flex-1 pt-4 md:pt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{student.parentName}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-xs uppercase tracking-wide">Guardian</span>
                                        <span className="text-xs">•</span>
                                        <span className="text-sm">{children.length} Child(ren) Enrolled</span>
                                    </p>
                                </div>
                                
                                <div className="flex gap-3">
                                     <button 
                                        onClick={handleCall}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                     >
                                        <Phone className="w-4 h-4" /> Call Now
                                     </button>
                                     <button 
                                        onClick={handleWhatsApp}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95"
                                     >
                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Contact Info Row */}
                <div className="px-8 pb-6 pt-2 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Phone className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase">Phone</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.contact}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase">Email</p>
                            <p className="font-medium text-gray-900 dark:text-white">Not Provided</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase">Address</p>
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{student.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Analytics Summary Card */}
            {children.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-500" /> Family Financial Overview
                            </h3>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                Session {currentSession}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Total Fees</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-2xl">₹{analyticsData.overall.total.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center border border-green-100 dark:border-green-800">
                                    <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase mb-1">Total Paid</p>
                                    <p className="font-bold text-green-700 dark:text-green-300 text-2xl">₹{analyticsData.overall.paid.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center border border-red-100 dark:border-red-800">
                                    <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase mb-1">Total Due</p>
                                    <p className="font-bold text-red-700 dark:text-red-300 text-2xl">₹{analyticsData.overall.due.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Children Cards */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
                    <Users className="w-5 h-5 text-indigo-500" /> Wards Enrolled ({children.length})
                </h3>
                
                {children.length > 0 ? (
                    children.map(child => {
                        const stats = getChildStats(child);
                        const isExpanded = expandedChildId === child.id;
                        
                        return (
                            <div key={child.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        {/* Child Header */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                                {child.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{child.name}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Class {child.grade} • ID: {child.id}</p>
                                                <div className="flex gap-2 mt-1.5">
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded border border-gray-200 dark:border-gray-600">
                                                        Session: {child.session}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Stats Bar */}
                                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex justify-around items-center">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Total Fees</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{stats.total.toLocaleString()}</p>
                                            </div>
                                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400">Paid</p>
                                                <p className="text-lg font-bold text-green-700 dark:text-green-300">₹{stats.paid.toLocaleString()}</p>
                                            </div>
                                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Due</p>
                                                <p className="text-lg font-bold text-red-700 dark:text-red-300">₹{stats.due.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button 
                                            onClick={() => openPayModal(child)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            <CreditCard className="w-4 h-4" /> Pay Fees
                                        </button>
                                        {/* No Per-Child History Toggle Button as per user intent for unified list, but logic kept implicitly */}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No children found linked to this profile in the current session.</p>
                    </div>
                )}
            </div>

            {/* Unified Payment History Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
                    <History className="w-5 h-5 text-indigo-500" /> Recent Transactions (All Wards)
                </h3>
                
                {allFamilyPayments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allFamilyPayments.map(payment => {
                            const child = children.find(c => c.id === payment.studentId);
                            const fee = fees.find(f => f.id === payment.feeStructureId);
                            const childStats = child ? getChildStats(child) : { percentage: 0 };
                            const styles = getCardStyles(childStats.percentage);
                            const isPaymentExpanded = expandedPaymentId === payment.id;
                            const isEditing = selectedPayment?.id === payment.id;
                            
                            if (!child) return null;

                            return (
                                <div 
                                    key={payment.id} 
                                    onClick={() => setExpandedPaymentId(isPaymentExpanded ? null : payment.id)}
                                    className={`group rounded-xl p-4 border transition-all duration-300 relative overflow-hidden cursor-pointer 
                                        ${styles.card} 
                                        ${isPaymentExpanded ? 'shadow-lg ring-2 ring-indigo-400/50 scale-[1.02] z-10' : 'hover:shadow-md'}
                                        ${isEditing ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                                    `}
                                >
                                        <div className="flex justify-between items-start mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium font-mono border ${styles.badge}`}>
                                            #{payment.id.slice(-6)}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles.subtext}`}>
                                            <Clock className="w-3 h-3" /> {payment.date}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm border-2 ${styles.iconBg}`}>
                                            {child.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`font-bold truncate ${styles.text}`} title={child.name}>
                                                {child.name}
                                            </h4>
                                            <p className={`text-xs truncate ${styles.subtext}`}>
                                                ID: {child.id} • Class {child.grade}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className={`pt-3 border-t flex items-end justify-between border-current/10`}>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${styles.subtext}`}>Paid For</p>
                                            <p className={`text-xs font-semibold truncate max-w-[120px] ${styles.text}`} title={fee?.name}>
                                                {fee?.name || 'Fee'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                +₹{payment.amountPaid.toLocaleString()}
                                                </p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${styles.badge}`}>
                                                {payment.method.toLowerCase()}
                                                </span>
                                        </div>
                                    </div>

                                    {/* Expanded Actions - Added Receipt button back */}
                                    <div className={`
                                        flex items-center justify-center gap-4 
                                        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top overflow-hidden
                                        ${isPaymentExpanded ? 'max-h-40 opacity-100 pt-4 pb-2' : 'max-h-0 opacity-0 py-0'}
                                    `}>
                                        {[
                                            { icon: <Eye className="w-4 h-4" />, label: 'Receipt', onClick: () => { setSelectedPayment(payment); setIsReceiptModalOpen(true); }, color: 'text-blue-600', ring: 'group-hover/btn:ring-blue-200' },
                                            { icon: <Trash2 className="w-4 h-4" />, label: 'Delete', onClick: () => handleDeleteClick(payment), color: 'text-red-600', ring: 'group-hover/btn:ring-red-200' }
                                        ].map((action, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                                                style={{ transitionDelay: isPaymentExpanded ? `${idx * 75}ms` : '0ms' }}
                                                className={`
                                                    group/btn flex flex-col items-center gap-2 focus:outline-none
                                                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                                    ${isPaymentExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'}
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-full bg-white dark:bg-gray-800 
                                                    shadow-md dark:shadow-none
                                                    border border-gray-100 dark:border-gray-700
                                                    flex items-center justify-center
                                                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                                    group-hover/btn:scale-110 group-hover/btn:-translate-y-1 group-hover/btn:shadow-lg
                                                    group-focus/btn:ring-2 ${action.ring} dark:group-focus/btn:ring-gray-700
                                                    ${action.color} dark:text-gray-200
                                                `}>
                                                    <span className="transform transition-transform duration-300 group-hover/btn:rotate-12">{action.icon}</span>
                                                </div>
                                                
                                                <span className="
                                                    text-[9px] font-bold uppercase tracking-wide
                                                    text-gray-500 dark:text-gray-400
                                                    bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full
                                                    border border-gray-100 dark:border-gray-700
                                                    transition-colors group-hover/btn:text-gray-900 dark:group-hover/btn:text-white
                                                ">
                                                    {action.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8 text-sm italic bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        No payment transactions found.
                    </div>
                )}
            </div>

            {/* --- PAY / EDIT MODAL --- */}
            {isPayModalOpen && selectedChild && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600" /> {selectedPayment ? 'Edit Payment' : 'Pay Fees'}
                            </h2>
                            <button onClick={() => { setIsPayModalOpen(false); setSelectedPayment(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 mb-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Student</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{selectedChild.name}</p>
                            </div>
                            
                            {/* Date Field (Visible for Edits, auto for new but editable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input 
                                    required
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={paymentForm.date}
                                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                                <select 
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={paymentForm.feeId}
                                    onChange={e => setPaymentForm({...paymentForm, feeId: e.target.value})}
                                >
                                    {selectedChild.feeStructureIds.map(fid => {
                                        const fee = fees.find(f => f.id === fid);
                                        return fee ? <option key={fee.id} value={fee.id}>{fee.name} (₹{fee.amount})</option> : null;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <input 
                                    required
                                    type="number" 
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={paymentForm.method}
                                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                                >
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" /> {selectedPayment ? 'Update Payment' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION --- */}
            {isDeletePaymentModalOpen && selectedPayment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Payment?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this payment of <strong>₹{selectedPayment.amountPaid}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setIsDeletePaymentModalOpen(false); setSelectedPayment(null); }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeletePayment}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- RECEIPT MODAL --- */}
            {isReceiptModalOpen && selectedPayment && (() => {
                 const receiptChild = students.find(s => s.id === selectedPayment.studentId);
                 const childAllPayments = payments.filter(p => p.studentId === selectedPayment.studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                 
                 let totalFees = 0;
                 if (receiptChild) {
                     if (receiptChild.totalClassFees && receiptChild.totalClassFees > 0) {
                        totalFees = receiptChild.totalClassFees;
                    } else {
                        receiptChild.feeStructureIds.forEach(fid => {
                            const fee = fees.find(f => f.id === fid);
                            if (fee) totalFees += fee.amount;
                        });
                    }
                    if (receiptChild.backFees) totalFees += receiptChild.backFees;
                 }
                 
                 const totalPaid = childAllPayments.reduce((sum, p) => sum + p.amountPaid, 0);
                 const balance = Math.max(0, totalFees - totalPaid);

                 return (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button 
                            onClick={() => setIsReceiptModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full print:hidden z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="overflow-y-auto custom-scrollbar relative flex-1 bg-white">
                            <div ref={receiptRef} className="p-8 bg-white text-gray-900 print:p-0">
                                <div className="text-center border-b-2 border-dashed border-gray-200 pb-6 mb-6">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 print:hidden">
                                        E
                                    </div>
                                    <h2 className="text-2xl font-bold uppercase tracking-wider text-indigo-900">The Education Hills</h2>
                                    <p className="text-sm text-gray-500 mt-1">Excellence in Education • Est 1995</p>
                                    <p className="text-xs text-gray-400">123 Academic Avenue, Knowledge City</p>
                                    <div className="mt-4 inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100">
                                        Fee Statement & Receipt
                                    </div>
                                </div>
                                
                                {receiptChild && (
                                     <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 text-sm">
                                         <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                 <p className="text-gray-500 text-xs uppercase font-bold">Student Name</p>
                                                 <p className="font-bold text-gray-900 text-lg">{receiptChild.name}</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-gray-500 text-xs uppercase font-bold">Enrollment ID</p>
                                                 <p className="font-bold text-gray-900">{receiptChild.id}</p>
                                             </div>
                                             <div>
                                                 <p className="text-gray-500 text-xs uppercase font-bold">Class / Grade</p>
                                                 <p className="font-semibold text-gray-900">{receiptChild.grade}</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-gray-500 text-xs uppercase font-bold">Session</p>
                                                 <p className="font-semibold text-gray-900">{currentSession}</p>
                                             </div>
                                         </div>
                                     </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
                                        <p className="text-xs text-blue-600 font-bold uppercase">Total Fees</p>
                                        <p className="text-lg font-bold text-blue-900">₹{totalFees.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
                                        <p className="text-xs text-green-600 font-bold uppercase">Paid Amount</p>
                                        <p className="text-lg font-bold text-green-900">₹{totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
                                        <p className="text-xs text-red-600 font-bold uppercase">Balance Due</p>
                                        <p className="text-lg font-bold text-red-900">₹{balance.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 border-b border-gray-100 pb-1">Transaction History</h3>
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                                <th className="px-3 py-2 rounded-l-lg">Date & Mode</th>
                                                <th className="px-3 py-2">Receipt #</th>
                                                <th className="px-3 py-2">Fee Type</th>
                                                <th className="px-3 py-2 text-right rounded-r-lg">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {childAllPayments.map((payment) => {
                                                const isCurrent = payment.id === selectedPayment.id;
                                                return (
                                                    <tr key={payment.id} className={isCurrent ? "bg-indigo-50/50" : ""}>
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-700 font-medium">{payment.date}</span>
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">{payment.method}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-xs text-gray-500">#{payment.id.slice(-6)}</td>
                                                        <td className="px-3 py-2 text-gray-800 font-medium">
                                                            {fees.find(f => f.id === payment.feeStructureId)?.name || 'Fee'}
                                                            {isCurrent && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">CURRENT</span>}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-gray-900">₹{payment.amountPaid.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
                                    <div className="text-left mb-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Terms & Conditions</p>
                                        <pre className="text-[10px] text-gray-500 whitespace-pre-wrap font-sans">
                                            {db.getSchoolProfile().feesReceiptTerms || "Fees once paid are not refundable."}
                                        </pre>
                                    </div>
                                    <p className="text-[10px] text-gray-300 mt-1">Generated electronically • {new Date().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3 print:hidden shrink-0">
                            <button 
                                onClick={handleSaveReceipt}
                                disabled={isGeneratingReceipt}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingReceipt ? <span className="animate-spin">⏳</span> : <Download className="w-4 h-4" />}
                                {isGeneratingReceipt ? 'Saving...' : 'Save Image'}
                            </button>
                            <button 
                                onClick={handleShareReceipt}
                                disabled={isGeneratingReceipt}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingReceipt ? <span className="animate-spin">⏳</span> : <Share2 className="w-4 h-4" />}
                                Quick Share
                            </button>
                        </div>
                     </div>
                 </div>
                 );
            })()}
        </div>
    );
};

export default ParentProfileView;