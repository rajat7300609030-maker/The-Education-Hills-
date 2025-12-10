
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../services/db';
import { PaymentRecord, Student, FeeStructure, UserRole } from '../types';
import { 
  Calendar, 
  Search, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  User, 
  History, 
  Phone, 
  Users, 
  Edit, 
  Trash2, 
  Printer, 
  Eye, 
  AlertTriangle, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  X, 
  TrendingUp, 
  FileText, 
  Wallet, 
  Share2, 
  Download 
} from 'lucide-react';
import { useNotification } from './NotificationProvider';

interface EmployeeDashboardProps {
  initialStudentId?: string | null;
  userRole?: UserRole;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ initialStudentId, userRole = UserRole.ADMIN }) => {
  const { showNotification } = useNotification();
  const [currentSession, setCurrentSession] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Toggle State for Payment Form
  const [isPaymentFormVisible, setIsPaymentFormVisible] = useState(true);

  // Toggle State for Payment History
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

  // Expansion State for Payment History Cards
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Main Payment Form State (New/Edit Payment)
  const [paymentForm, setPaymentForm] = useState({
      classId: '',
      studentId: '',
      feeId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Cash'
  });

  // Shared Selected Payment State (for actions & edit mode)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Delete Payment State
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  
  // Smart Fee Stats State
  const [selectedFeeStats, setSelectedFeeStats] = useState<{total: number, paid: number, due: number} | null>(null);

  useEffect(() => {
    const session = db.getSchoolProfile().currentSession;
    setCurrentSession(session);
    setPayments(db.getPayments().filter(p => p.session === session));
    setStudents(db.getStudents().filter(s => s.session === session));
    setFees(db.getFees().filter(f => f.session === session));
    setClasses(db.getClasses());
  }, []);

  // Handle Initial Student ID from navigation
  useEffect(() => {
    if (initialStudentId && students.length > 0) {
        const student = students.find(s => s.id === initialStudentId);
        if (student) {
            setPaymentForm(prev => ({
                ...prev,
                classId: student.grade,
                studentId: student.id,
                feeId: '',
                amount: ''
            }));
            setIsPaymentFormVisible(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }, [initialStudentId, students]);

  const refreshPayments = () => {
      setPayments(db.getPayments().filter(p => p.session === currentSession));
  };

  // Calculate Fee Stats when Student or Fee selection changes
  useEffect(() => {
    if(paymentForm.studentId && paymentForm.feeId) {
       const fee = fees.find(f => f.id === paymentForm.feeId);
       const student = students.find(s => s.id === paymentForm.studentId);
       
       if(fee && student) {
           // Determine effective fee amount (check if student has override)
           let total = fee.amount;
           if (student.totalClassFees && student.totalClassFees > 0 && student.feeStructureIds[0] === fee.id) {
               total = student.totalClassFees;
           }

           // Calculate paid amount for this specific fee
           const paid = payments
               .filter(p => p.studentId === paymentForm.studentId && p.feeStructureId === paymentForm.feeId)
               .reduce((sum, p) => sum + p.amountPaid, 0);
           
           const due = Math.max(0, total - paid);
           
           setSelectedFeeStats({ total, paid, due });
           
           // Auto-fill amount if empty or if previously auto-filled, ONLY if not in edit mode
           if (!selectedPayment) {
               setPaymentForm(prev => ({...prev, amount: due.toString()}));
           }
       }
    } else {
       setSelectedFeeStats(null);
    }
  }, [paymentForm.feeId, paymentForm.studentId, fees, payments, students, selectedPayment]);

  // General Student Profile Data (Memoized)
  const selectedStudentData = useMemo(() => {
    if (!paymentForm.studentId) return null;
    const student = students.find(s => s.id === paymentForm.studentId);
    if (!student) return null;

    // Calculate Total Fees
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

    // Calculate Total Paid
    const studentPayments = payments.filter(p => p.studentId === student.id);
    const paid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    // Calculate Total Due
    const due = Math.max(0, total - paid);

    // Get Last Payment
    const sortedPayments = [...studentPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : null;

    return {
        student,
        total,
        paid,
        due,
        lastPayment
    };
  }, [paymentForm.studentId, students, fees, payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // 1. If a student is selected in the form, only show their payments
      if (paymentForm.studentId && payment.studentId !== paymentForm.studentId) {
          return false;
      }

      // 2. Date filtering
      const paymentDate = new Date(payment.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && paymentDate < start) return false;
      if (end) {
          end.setHours(23, 59, 59, 999); 
          if (paymentDate > end) return false;
      }

      // 3. Search filtering
      if (searchTerm) {
          const student = students.find(s => s.id === payment.studentId);
          const searchLower = searchTerm.toLowerCase();
          const matchesName = student?.name.toLowerCase().includes(searchLower);
          const matchesId = payment.studentId.toLowerCase().includes(searchLower);
          const matchesPaymentId = payment.id.toLowerCase().includes(searchLower);
          
          if (!matchesName && !matchesId && !matchesPaymentId) return false;
      }

      return true;
    }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) {
            return dateB - dateA;
        }
        // Tie-breaker: ID descending
        return (b.id || '').localeCompare(a.id || '');
    });
  }, [payments, startDate, endDate, searchTerm, students, paymentForm.studentId]);

  const stats = useMemo(() => {
      const total = filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const today = new Date().toISOString().split('T')[0];
      const todayAmount = filteredPayments
        .filter(p => p.date === today)
        .reduce((sum, p) => sum + p.amountPaid, 0);
      const count = filteredPayments.length;
      return { total, todayAmount, count };
  }, [filteredPayments]);

  const availableStudents = useMemo(() => {
      if (!paymentForm.classId) return [];
      return students.filter(s => s.grade === paymentForm.classId);
  }, [students, paymentForm.classId]);

  // Use all fees for dropdown instead of filtered list
  const allFeeOptions = fees;

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!paymentForm.studentId || !paymentForm.feeId || !paymentForm.amount) return;

      let paymentToReceipt: PaymentRecord;

      if (selectedPayment) {
          // Update Existing Payment
          const updated: PaymentRecord = {
              ...selectedPayment,
              studentId: paymentForm.studentId,
              feeStructureId: paymentForm.feeId,
              amountPaid: parseFloat(paymentForm.amount),
              date: paymentForm.date,
              method: paymentForm.method,
              session: currentSession
          };
          db.updatePayment(updated);
          showNotification(`Payment of ₹${updated.amountPaid} updated`, 'success');
          paymentToReceipt = updated;
      } else {
          // Create New Payment
          const newPayment: PaymentRecord = {
              id: `P${Date.now()}`,
              studentId: paymentForm.studentId,
              feeStructureId: paymentForm.feeId,
              amountPaid: parseFloat(paymentForm.amount),
              date: paymentForm.date,
              method: paymentForm.method,
              session: currentSession
          };
          db.addPayment(newPayment);
          showNotification(`Payment of ₹${newPayment.amountPaid} recorded successfully`, 'success');
          paymentToReceipt = newPayment;
      }

      refreshPayments();
      
      // Reset form but keep logic flow to show receipt
      setPaymentForm({
          classId: '',
          studentId: '',
          feeId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          method: 'Cash'
      });
      setSelectedFeeStats(null);
      setIsPaymentFormVisible(false); // Collapse form section

      // Automatically open receipt for the processed payment
      setSelectedPayment(paymentToReceipt);
      setIsReceiptModalOpen(true);
  };

  const handleCancel = () => {
      setPaymentForm({
          classId: '',
          studentId: '',
          feeId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          method: 'Cash'
      });
      setSelectedFeeStats(null);
      setSelectedPayment(null); // Exit edit mode
  };
  
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

  // Helper for Card Styles based on Percentage
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
  
  const PAYMENT_METHODS = ['Cash', 'UPI', 'Online Transfer', 'Cheque'];

  // --- Handlers for Payment Actions ---

  const handleEditClick = (payment: PaymentRecord) => {
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
          setSelectedPayment(payment);
          setPaymentForm({
              classId: student.grade,
              studentId: payment.studentId,
              feeId: payment.feeStructureId,
              amount: payment.amountPaid.toString(),
              date: payment.date,
              method: payment.method
          });
          setIsPaymentFormVisible(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleDeleteClick = (payment: PaymentRecord) => {
      setSelectedPayment(payment);
      setIsDeletePaymentModalOpen(true);
  };

  const confirmDelete = () => {
      if (selectedPayment) {
          db.deletePayment(selectedPayment.id);
          refreshPayments();
          showNotification(`Payment #${selectedPayment.id} moved to Recycle Bin`, 'success');
          setIsDeletePaymentModalOpen(false);
          setSelectedPayment(null);
      }
  };

  const handleReceiptClick = (payment: PaymentRecord) => {
      setSelectedPayment(payment);
      setIsReceiptModalOpen(true);
  };

  const handleSaveReceipt = async () => {
      // ... receipt logic ...
      if (!receiptRef.current) return;
      setIsGeneratingReceipt(true);
      try {
          const html2canvas = (window as any).html2canvas;
          if (!html2canvas) {
              alert("Image generation library not loaded. Please refresh.");
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
          console.error("Failed to save receipt", err);
          showNotification("Failed to generate receipt image.", 'error');
      } finally {
          setIsGeneratingReceipt(false);
      }
  };

  const handleShareReceipt = async () => {
      // ... share logic ...
      if (!receiptRef.current) return;
      setIsGeneratingReceipt(true);
      try {
          const html2canvas = (window as any).html2canvas;
          if (!html2canvas) {
              alert("Image generation library not loaded. Please refresh.");
              return;
          }
          const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, scrollY: -window.scrollY });
          
          canvas.toBlob(async (blob: Blob | null) => {
              if (!blob) {
                  setIsGeneratingReceipt(false);
                  return;
              }
              
              let shareSuccess = false;
              try {
                  let fileConstructorSupported = false;
                  try {
                      new File([], "check");
                      fileConstructorSupported = true;
                  } catch (e) {
                      // File constructor not supported
                  }

                  if (fileConstructorSupported && navigator.share) {
                      const fileName = `Receipt_${selectedPayment?.id || 'Fee'}.png`;
                      const file = new File([blob], fileName, { type: 'image/png' });
                      
                      const shareData = {
                          title: 'Fee Receipt',
                          text: `Payment Receipt for ${selectedPayment?.id}`,
                          files: [file]
                      };

                      if (navigator.canShare && !navigator.canShare(shareData)) {
                          console.warn("navigator.canShare returned false for receipt image");
                          throw new Error("Sharing not supported for this file type");
                      }

                      await navigator.share(shareData);
                      shareSuccess = true;
                  }
              } catch (e) {
                  console.warn("Share failed or not supported:", e);
              }

              if (!shareSuccess) {
                  try {
                      const link = document.createElement('a');
                      link.href = canvas.toDataURL("image/png");
                      link.download = `Receipt_${selectedPayment?.id || 'Fee'}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                  } catch (downloadError) {
                      console.error("Download fallback failed:", downloadError);
                  }
              }
              
              setIsGeneratingReceipt(false);
          }, 'image/png');
      } catch (err) {
          console.error("Failed to generate receipt image", err);
          setIsGeneratingReceipt(false);
      }
  };

  const actionButtons = [
      { icon: <Eye className="w-4 h-4" />, label: 'Receipt', onClick: handleReceiptClick, color: 'text-blue-600', ring: 'group-hover/btn:ring-blue-200', role: 'ALL' },
      { icon: <Edit className="w-4 h-4" />, label: 'Edit', onClick: handleEditClick, color: 'text-indigo-600', ring: 'group-hover/btn:ring-indigo-200', role: UserRole.ADMIN },
      { icon: <Trash2 className="w-4 h-4" />, label: 'Delete', onClick: handleDeleteClick, color: 'text-red-600', ring: 'group-hover/btn:ring-red-200', role: UserRole.ADMIN }
  ].filter(action => action.role === 'ALL' || action.role === userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-2 md:p-4 h-[calc(100vh-100px)]">
        {/* --- Top Header --- */}
        <div className="flex flex-row justify-between items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    💰 Fees Manager
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    Seamlessly manage student fee collections, track payment history, and generate instant receipts.
                 </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 text-right">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold text-xs shadow-sm whitespace-nowrap w-fit">
                    Session: {currentSession}
                </div>
            </div>
        </div>

        {/* --- ADD NEW / EDIT PAYMENT CARD (Only for Admin) --- */}
        {userRole === UserRole.ADMIN && (
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border overflow-hidden max-w-4xl mx-auto transition-all duration-300 hover:shadow-2xl ${selectedPayment ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className={`bg-gradient-to-r p-6 flex justify-between items-center text-white ${selectedPayment ? 'from-indigo-700 to-purple-700' : 'from-indigo-600 to-blue-600'}`}>
                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setIsPaymentFormVisible(!isPaymentFormVisible)}
                    >
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {selectedPayment ? <Edit className="w-6 h-6 text-indigo-200" /> : <CreditCard className="w-6 h-6 text-indigo-200" />}
                            {selectedPayment ? 'Update Payment Details' : 'Record New Payment'}
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1 opacity-90">
                            {selectedPayment ? `Editing Payment #${selectedPayment.id}` : 'Select a student and enter payment details'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <button 
                            onClick={() => setIsPaymentFormVisible(!isPaymentFormVisible)}
                            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm shadow-sm"
                        >
                            {isPaymentFormVisible ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPaymentFormVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <form onSubmit={handlePaymentSubmit} className="p-6 md:p-8">
                        {/* ... (Form Content Same as before) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-7 space-y-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">
                                    1. Student Details
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">🎓 Class Grade</label>
                                        <div className="relative">
                                            <select required className="w-full pl-4 pr-8 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none text-gray-900 dark:text-white transition-shadow" value={paymentForm.classId} onChange={(e) => setPaymentForm(prev => ({ ...prev, classId: e.target.value, studentId: '', feeId: '' }))}>
                                                <option value="" disabled className="text-gray-500 bg-gray-50 dark:bg-gray-700">Select Class</option>
                                                {classes.map(c => <option key={c} value={c} className="text-gray-900 dark:text-white bg-white dark:bg-gray-700">{c}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">👤 Student Name</label>
                                        <div className="relative">
                                            <select required disabled={!paymentForm.classId} className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none text-gray-900 dark:text-white disabled:opacity-50 transition-shadow" value={paymentForm.studentId} onChange={(e) => setPaymentForm(prev => ({ ...prev, studentId: e.target.value, feeId: '' }))}>
                                                <option value="" disabled className="text-gray-500 bg-gray-50 dark:bg-gray-700">Select Student</option>
                                                {availableStudents.map(s => <option key={s.id} value={s.id} className="text-gray-900 dark:text-white bg-white dark:bg-gray-700">{s.name}</option>)}
                                            </select>
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                {selectedStudentData && (
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 border-2 border-white dark:border-gray-700 shadow-sm shrink-0 overflow-hidden">
                                                {selectedStudentData.student.avatar ? (
                                                    <img src={selectedStudentData.student.avatar} alt={selectedStudentData.student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    selectedStudentData.student.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">{selectedStudentData.student.name}</h4>
                                                <div className="flex flex-wrap gap-y-1 gap-x-3 mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded"><span className="opacity-70">ID:</span> <span className="font-semibold">{selectedStudentData.student.id}</span></div>
                                                    <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded"><Users className="w-3 h-3 opacity-70" /><span className="font-semibold truncate max-w-[100px]">{selectedStudentData.student.parentName}</span></div>
                                                    <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded"><Phone className="w-3 h-3 opacity-70" /><span className="font-semibold">{selectedStudentData.student.contact}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800/50">
                                            <div className="text-center"><p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Total Fees</p><p className="font-bold text-gray-900 dark:text-white text-sm">₹{selectedStudentData.total.toLocaleString()}</p></div>
                                            <div className="text-center border-l border-indigo-200 dark:border-indigo-800/50"><p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400">Paid</p><p className="font-bold text-green-700 dark:text-green-300 text-sm">₹{selectedStudentData.paid.toLocaleString()}</p></div>
                                            <div className="text-center border-l border-indigo-200 dark:border-indigo-800/50"><p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Due</p><p className="font-bold text-red-700 dark:text-red-300 text-sm">₹{selectedStudentData.due.toLocaleString()}</p></div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">🏷️ Fee Category</label>
                                    <div className="relative">
                                        <select required disabled={!paymentForm.studentId} className="w-full pl-4 pr-8 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none appearance-none text-gray-900 dark:text-white disabled:bg-gray-50 disabled:opacity-50 transition-all" value={paymentForm.feeId} onChange={(e) => setPaymentForm(prev => ({ ...prev, feeId: e.target.value }))}>
                                            <option value="" disabled className="text-gray-500 bg-white dark:bg-gray-800">Select Fee Structure</option>
                                            {allFeeOptions.map(f => <option key={f.id} value={f.id} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{f.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">2. Transaction Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">📅 Payment Date</label>
                                            <input required type="date" className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white" value={paymentForm.date} onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">💳 Payment Mode</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PAYMENT_METHODS.map(mode => (
                                                    <button key={mode} type="button" onClick={() => setPaymentForm(prev => ({ ...prev, method: mode }))} className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg border transition-all ${paymentForm.method === mode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{mode}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                             <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1.5 block">💰 Amount to {selectedPayment ? 'Update' : 'Collect'}</label>
                                             <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-light">₹</span>
                                                <input required type="number" min="1" className="w-full pl-10 pr-4 py-4 bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-gray-600 rounded-xl text-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-200" value={paymentForm.amount} placeholder="0" onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))} />
                                             </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                    <button type="button" onClick={handleCancel} className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-colors shadow-lg ${selectedPayment ? 'bg-gray-500 hover:bg-gray-600 shadow-gray-200 dark:shadow-gray-900/20' : 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20'}`}>{selectedPayment ? 'Cancel Edit' : 'Reset'}</button>
                                    <button type="submit" disabled={!paymentForm.studentId || !paymentForm.feeId || !paymentForm.amount} className="flex-[2] py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">{selectedPayment ? <Save className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}{selectedPayment ? 'Update Payment' : 'Submit'}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- PAYMENT HISTORY SECTION --- */}
        <div className="mt-8 space-y-6">
            <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                
                {/* Header Row: Title and Filters */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div 
                        className="cursor-pointer flex-1"
                        onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                    >
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400" /> 
                            Payment History
                        </h2>
                        <p className="text-sm text-gray-300 mt-1">
                             {paymentForm.studentId 
                                ? `Showing records for ${students.find(s => s.id === paymentForm.studentId)?.name}` 
                                : "Track all recent fee collections and transactions"
                            }
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                         {/* Date Filters */}
                         <div className={`flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 w-full md:w-auto transition-all duration-300 ${!isHistoryVisible ? 'opacity-50 pointer-events-none hidden md:flex' : ''}`}>
                            <div className="relative flex-1 md:flex-none">
                                <input 
                                    type="date"
                                    className="w-full md:w-32 pl-8 pr-2 py-1.5 bg-transparent text-xs font-medium text-white focus:outline-none placeholder-gray-400"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={!isHistoryVisible}
                                />
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                            <span className="text-gray-400">to</span>
                            <div className="relative flex-1 md:flex-none">
                                <input 
                                    type="date"
                                    className="w-full md:w-32 pl-8 pr-2 py-1.5 bg-transparent text-xs font-medium text-white focus:outline-none placeholder-gray-400"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={!isHistoryVisible}
                                />
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                         </div>

                         {/* Search */}
                         <div className={`relative flex-1 md:flex-none w-full md:w-64 transition-all duration-300 ${!isHistoryVisible ? 'opacity-50 pointer-events-none hidden md:block' : ''}`}>
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                             <input 
                                type="text" 
                                placeholder="Search by Student Name or ID..." 
                                className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none text-white placeholder-gray-400"
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                disabled={!isHistoryVisible}
                             />
                         </div>
                         
                         {/* Toggle Button */}
                         <button 
                            onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                            className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all backdrop-blur-sm shadow-sm text-white flex-shrink-0"
                         >
                            {isHistoryVisible ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                         </button>
                    </div>
                </div>

                {/* NEW: Stats Row inside Header Card - Collapsible */}
                <div className={`relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${isHistoryVisible ? 'max-h-[500px] opacity-100 mt-6 pt-6 border-t border-gray-700/50' : 'max-h-0 opacity-0 border-none'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Total Collection</p>
                                <p className="text-xl font-bold text-white tracking-tight">₹{stats.total.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Today's Collection</p>
                                <p className="text-xl font-bold text-white tracking-tight">₹{stats.todayAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Total Transactions</p>
                                <p className="text-xl font-bold text-white tracking-tight">{stats.count}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Cards Grid - Collapsible */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isHistoryVisible ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {filteredPayments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredPayments.map((payment) => {
                            const student = students.find(s => s.id === payment.studentId);
                            const fee = fees.find(f => f.id === payment.feeStructureId);
                            
                            // Calculate percentage for styling
                            const percentage = getStudentPercentage(payment.studentId);
                            const styles = getCardStyles(percentage);
                            const isExpanded = expandedPaymentId === payment.id;
                            const isEditing = selectedPayment?.id === payment.id;
                            
                            return (
                                <div 
                                    key={payment.id} 
                                    onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                                    className={`group rounded-xl p-4 border transition-all duration-300 relative overflow-hidden cursor-pointer 
                                        ${styles.card} 
                                        ${isExpanded ? 'shadow-lg ring-2 ring-indigo-400/50 scale-[1.02] z-10' : 'hover:shadow-md'}
                                        ${isEditing ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                                    `}
                                >
                                    {isEditing && (
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-20">
                                            EDITING
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium font-mono border ${styles.badge}`}>
                                            #{payment.id.slice(-6)}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles.subtext}`}>
                                            <Clock className="w-3 h-3" /> {payment.date}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm border-2 ${styles.iconBg} overflow-hidden`}>
                                            {student?.avatar ? (
                                                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                            ) : (
                                                student?.name.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`font-bold truncate ${styles.text}`} title={student?.name}>
                                                {student?.name || 'Unknown Student'}
                                            </h4>
                                            <p className={`text-xs truncate ${styles.subtext}`}>
                                                ID: {student?.id} • Class {student?.grade}
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

                                    {/* Expanded Actions - Floating Circular Buttons */}
                                    <div className={`
                                        flex items-center justify-center gap-4 
                                        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top overflow-hidden
                                        ${isExpanded ? 'max-h-40 opacity-100 pt-4 pb-2' : 'max-h-0 opacity-0 py-0'}
                                    `}>
                                        {[
                                            { icon: <Edit className="w-4 h-4" />, label: 'Edit', onClick: handleEditClick, color: 'text-indigo-600', ring: 'group-hover/btn:ring-indigo-200', role: UserRole.ADMIN },
                                            { icon: <Eye className="w-4 h-4" />, label: 'Receipt', onClick: handleReceiptClick, color: 'text-blue-600', ring: 'group-hover/btn:ring-blue-200', role: 'ALL' },
                                            { icon: <Trash2 className="w-4 h-4" />, label: 'Delete', onClick: handleDeleteClick, color: 'text-red-600', ring: 'group-hover/btn:ring-red-200', role: UserRole.ADMIN }
                                        ].filter(action => action.role === 'ALL' || action.role === userRole).map((action, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={(e) => { e.stopPropagation(); action.onClick(payment); }}
                                                style={{ transitionDelay: isExpanded ? `${idx * 75}ms` : '0ms' }}
                                                className={`
                                                    group/btn flex flex-col items-center gap-2 focus:outline-none
                                                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                                    ${isExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'}
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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Search className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No payments found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Try adjusting your date filters or search terms.
                        </p>
                    </div>
                )}
            </div>

            {/* --- DELETE PAYMENT CONFIRMATION --- */}
            {isDeletePaymentModalOpen && selectedPayment && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Payment?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this payment record of <strong>₹{selectedPayment.amountPaid}</strong>?
                                <br/><br/>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">This item will be moved to the Recycle Bin.</span>
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDeletePaymentModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW RECEIPT / STATEMENT MODAL --- */}
            {isReceiptModalOpen && selectedPayment && (() => {
            const receiptStudent = students.find(s => s.id === selectedPayment.studentId);
            const studentAllPayments = payments.filter(p => p.studentId === selectedPayment.studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Calculate totals
            let totalFees = 0;
            if (receiptStudent) {
                 if (receiptStudent.totalClassFees && receiptStudent.totalClassFees > 0) {
                    totalFees = receiptStudent.totalClassFees;
                } else {
                    receiptStudent.feeStructureIds.forEach(fid => {
                        const fee = fees.find(f => f.id === fid);
                        if (fee) totalFees += fee.amount;
                    });
                }
                if (receiptStudent.backFees) totalFees += receiptStudent.backFees;
            }
            
            const totalPaid = studentAllPayments.reduce((sum, p) => sum + p.amountPaid, 0);
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
                    
                    {/* SCROLLABLE PARENT WRAPPER */}
                    <div className="overflow-y-auto custom-scrollbar relative flex-1 bg-white">
                        {/* CAPTURE TARGET CHILD - FULL HEIGHT */}
                        <div ref={receiptRef} className="p-8 bg-white text-gray-900 print:p-0">
                             {/* Receipt Header */}
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

                             {/* Student Details */}
                             {receiptStudent && (
                                 <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 text-sm">
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                             <p className="text-gray-500 text-xs uppercase font-bold">Student Name</p>
                                             <p className="font-bold text-gray-900 text-lg">{receiptStudent.name}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-gray-500 text-xs uppercase font-bold">Enrollment ID</p>
                                             <p className="font-bold text-gray-900">{receiptStudent.id}</p>
                                         </div>
                                         <div>
                                             <p className="text-gray-500 text-xs uppercase font-bold">Class / Grade</p>
                                             <p className="font-semibold text-gray-900">{receiptStudent.grade}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-gray-500 text-xs uppercase font-bold">Session</p>
                                             <p className="font-semibold text-gray-900">{currentSession}</p>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* Financial Summary */}
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

                             {/* Transaction History Table */}
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
                                         {studentAllPayments.map((payment) => {
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

                             {/* Footer */}
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
