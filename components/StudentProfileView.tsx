
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
    ArrowLeft, 
    User, 
    Phone, 
    MapPin, 
    Calendar, 
    CreditCard, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Download,
    Mail,
    Users,
    GraduationCap,
    Edit,
    Trash2,
    MessageCircle,
    Plus,
    X,
    Save,
    FileText,
    ChevronDown,
    Printer,
    MoreHorizontal,
    TrendingUp,
    Briefcase,
    Search,
    Filter,
    ChevronUp,
    DollarSign,
    Eye,
    Share2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Camera,
    ListPlus
} from 'lucide-react';
import { db } from '../services/db';
import { Student, FeeStructure, PaymentRecord, UserRole } from '../types';
import { useNotification } from './NotificationProvider';

interface Props {
    studentId: string | null;
    onBack: () => void;
    userRole?: UserRole;
    onNavigateToParentProfile?: (studentId: string) => void;
    onNavigateToFees?: (studentId: string) => void;
}

const StudentProfileView: React.FC<Props> = ({ studentId, onBack, userRole = UserRole.ADMIN, onNavigateToParentProfile, onNavigateToFees }) => {
    const { showNotification } = useNotification();
    const [refreshKey, setRefreshKey] = useState(0); 
    const [classes, setClasses] = useState<string[]>([]);
    
    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // For Student
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false); // For Payment
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    
    // Fee Config Modal State
    const [isFeeConfigModalOpen, setIsFeeConfigModalOpen] = useState(false);

    // ID Card State
    const [currentIdCardDesign, setCurrentIdCardDesign] = useState(0);

    // Payment Action States
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
    const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Form States
    const [studentForm, setStudentForm] = useState({
        name: '',
        grade: '',
        parentName: '',
        contact: '',
        dob: '',
        address: '',
        totalClassFees: '',
        backFees: '',
        admissionDate: '',
        avatar: ''
    });

    // New Fee Form State
    const [newFeeForm, setNewFeeForm] = useState({
        name: '',
        amount: '',
        dueDate: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        feeId: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0]
    });

    const PAYMENT_METHODS = ['Cash', 'UPI', 'Online Transfer', 'Cheque'];

    useEffect(() => {
        setClasses(db.getClasses());
    }, []);

    // 1. Fetch Data
    const student = useMemo(() => {
        if (!studentId) return null;
        return db.getStudents().find(s => s.id === studentId);
    }, [studentId, refreshKey]);

    const fees = useMemo(() => db.getFees(), [refreshKey]); // Refresh fees when updated
    
    const payments = useMemo(() => {
        if (!studentId) return [];
        return db.getPayments()
            .filter(p => p.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [studentId, refreshKey]);

    // Initialize Forms
    useEffect(() => {
        if (student && isEditModalOpen) {
            setStudentForm({
                name: student.name,
                grade: student.grade,
                parentName: student.parentName,
                contact: student.contact,
                dob: student.dob || '',
                address: student.address || '',
                totalClassFees: student.totalClassFees?.toString() || '',
                backFees: student.backFees?.toString() || '',
                admissionDate: student.admissionDate || '',
                avatar: student.avatar || ''
            });
        }
    }, [student, isEditModalOpen]);

    // Initialize Payment Form (Add vs Edit)
    useEffect(() => {
        if (student && isPayModalOpen) {
            if (selectedPayment) {
                // Edit Mode
                setPaymentForm({
                    amount: selectedPayment.amountPaid.toString(),
                    feeId: selectedPayment.feeStructureId,
                    method: selectedPayment.method,
                    date: selectedPayment.date
                });
            } else {
                // Add Mode
                setPaymentForm({
                    amount: '',
                    feeId: student.feeStructureIds.length > 0 ? student.feeStructureIds[0] : '',
                    method: 'Cash',
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [student, isPayModalOpen, selectedPayment]);

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <p className="text-xl font-semibold">Student not found</p>
                <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">Go Back</button>
            </div>
        );
    }

    // 2. Calculate Financials
    const financialSummary = useMemo(() => {
        const feeDetails = student.feeStructureIds.map((fid, index) => {
            const feeStructure = fees.find(f => f.id === fid);
            if (!feeStructure) return null;

            let effectiveAmount = feeStructure.amount;
            if (index === 0 && student.totalClassFees && student.totalClassFees > 0) {
                effectiveAmount = student.totalClassFees;
            }

            const paidForThisFee = payments
                .filter(p => p.feeStructureId === fid)
                .reduce((sum, p) => sum + p.amountPaid, 0);

            const balance = Math.max(0, effectiveAmount - paidForThisFee);
            
            let status = 'PENDING';
            if (balance === 0) status = 'PAID';
            else if (paidForThisFee > 0) status = 'PARTIAL';
            
            if (status !== 'PAID' && new Date(feeStructure.dueDate) < new Date()) {
                status = 'OVERDUE';
            }

            return {
                ...feeStructure,
                effectiveAmount,
                paid: paidForThisFee,
                balance,
                status
            };
        }).filter(Boolean) as any[];

        let totalExpected = feeDetails.reduce((sum, f) => sum + f.effectiveAmount, 0);
        let totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        
        if (student.backFees) {
            totalExpected += student.backFees;
        }

        const totalDue = Math.max(0, totalExpected - totalPaid);
        const progress = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

        return { feeDetails, totalExpected, totalPaid, totalDue, progress };
    }, [student, fees, payments]);

    // --- Helper: Card Styles ---
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

    // --- Actions ---

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setStudentForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedStudent: Student = {
            ...student,
            name: studentForm.name,
            grade: studentForm.grade,
            parentName: studentForm.parentName,
            contact: studentForm.contact,
            dob: studentForm.dob,
            address: studentForm.address,
            totalClassFees: studentForm.totalClassFees ? parseFloat(studentForm.totalClassFees) : undefined,
            backFees: studentForm.backFees ? parseFloat(studentForm.backFees) : undefined,
            admissionDate: studentForm.admissionDate,
            avatar: studentForm.avatar
        };
        db.updateStudent(updatedStudent);
        showNotification("Student updated successfully", "success");
        setRefreshKey(prev => prev + 1);
        setIsEditModalOpen(false);
    };

    const handleDeleteStudent = () => {
        db.deleteStudent(student.id);
        showNotification("Student deleted", "success");
        setIsDeleteModalOpen(false);
        onBack();
    };

    const handleSaveFeeStructure = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeeForm.name || !newFeeForm.amount || !newFeeForm.dueDate) return;

        const newFee: FeeStructure = {
            id: `F_${Date.now()}`,
            name: newFeeForm.name,
            amount: parseFloat(newFeeForm.amount),
            dueDate: newFeeForm.dueDate,
            session: student.session
        };

        // 1. Add to Global Fee List
        db.addFeeStructure(newFee);

        // 2. Assign to current student
        const updatedStudent = {
            ...student,
            feeStructureIds: [...student.feeStructureIds, newFee.id]
        };
        db.updateStudent(updatedStudent);

        showNotification("New Fee added and assigned to student", "success");
        
        // Reset and Close
        setNewFeeForm({ name: '', amount: '', dueDate: '' });
        setIsFeeConfigModalOpen(false);
        setRefreshKey(prev => prev + 1);
    };

    const handleSavePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentForm.amount && paymentForm.feeId) {
            if (selectedPayment) {
                // Update
                const updatedPayment: PaymentRecord = {
                    ...selectedPayment,
                    feeStructureId: paymentForm.feeId,
                    amountPaid: parseFloat(paymentForm.amount),
                    date: paymentForm.date,
                    method: paymentForm.method
                };
                db.updatePayment(updatedPayment);
                showNotification("Payment updated", "success");
            } else {
                // Create
                const newPayment: PaymentRecord = {
                    id: `P${Date.now()}`,
                    studentId: student.id,
                    feeStructureId: paymentForm.feeId,
                    amountPaid: parseFloat(paymentForm.amount),
                    date: paymentForm.date,
                    method: paymentForm.method,
                    session: student.session
                };
                db.addPayment(newPayment);
                showNotification("Payment recorded", "success");
            }
            
            setRefreshKey(prev => prev + 1);
            setIsPayModalOpen(false);
            setSelectedPayment(null);
        }
    };

    const handleEditPayment = (payment: PaymentRecord) => {
        if (onNavigateToFees) {
            onNavigateToFees(payment.studentId);
        } else {
            setSelectedPayment(payment);
            setIsPayModalOpen(true);
        }
    };

    const handleDeletePayment = (payment: PaymentRecord) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    };

    const confirmDeletePayment = () => {
        if (selectedPayment) {
            db.deletePayment(selectedPayment.id);
            showNotification("Payment deleted", "success");
            setRefreshKey(prev => prev + 1);
            setIsDeletePaymentModalOpen(false);
            setSelectedPayment(null);
        }
    };

    const handleViewReceipt = (payment: PaymentRecord) => {
        setSelectedPayment(payment);
        setIsReceiptModalOpen(true);
    };

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
            console.error("Receipt error", err);
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

    const handleCallParent = () => {
        window.location.href = `tel:${student.contact}`;
    };

    const handleGroupClick = () => {
        if (onNavigateToParentProfile) {
            onNavigateToParentProfile(student.id);
        } else {
            alert(`Navigate to parent group for ${student.parentName}`);
        }
    };

    const getPaymentPercentage = () => {
        return financialSummary.totalExpected > 0 ? (financialSummary.totalPaid / financialSummary.totalExpected) * 100 : 0;
    };

    // ID Card Handlers
    const handleDownloadIdCard = async () => {
        const element = document.getElementById('id-card-content-profile');
        if (!element) return;
        
        try {
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
                alert("Image generation library not loaded.");
                return;
            }
            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = 'none';
            const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null });
            element.style.boxShadow = originalShadow;

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `ID_Card_${student.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification("ID Card downloaded successfully", 'success');
        } catch (err) {
            console.error("Failed to generate ID card", err);
            showNotification("Failed to generate ID card.", 'error');
        }
    };

    const nextDesign = () => setCurrentIdCardDesign((prev) => (prev + 1) % 5);
    const prevDesign = () => setCurrentIdCardDesign((prev) => (prev - 1 + 5) % 5);

    const renderIdCard = () => {
        const profile = db.getSchoolProfile();
        const schoolAddress = profile.address;
        const currentSession = profile.currentSession;

        const commonContent = (
            <>
                <div className="space-y-1.5 text-left text-[10px]">
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">ID No</span> <span className="font-bold">{student.id}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Class</span> <span className="font-bold">{student.grade}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Guardian</span> <span className="font-bold truncate max-w-[120px]">{student.parentName}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">DOB</span> <span className="font-bold">{student.dob || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Phone</span> <span className="font-bold">{student.contact}</span></div>
                </div>
            </>
        );

        if (currentIdCardDesign === 0) { // Classic Blue
            return (
                <div id="id-card-content-profile" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col">
                    <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-600 relative shrink-0">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        <div className="absolute top-4 left-0 w-full text-center text-white">
                            <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">{profile.name}</h3>
                            <p className="text-[10px] opacity-80">{profile.tagline}</p>
                        </div>
                    </div>
                    <div className="px-6 pb-6 pt-0 relative text-center flex-1 flex flex-col">
                        <div className="-mt-10 mb-3 flex justify-center">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden uppercase">
                                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{student.name}</h2>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-6">Student</p>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 flex-1">{commonContent}</div>
                        <div className="mt-4 pt-3 border-t border-gray-100 shrink-0">
                            <div className="flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">Session</p>
                                    <p className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1">{currentSession}</p>
                                    <p className="text-[8px] text-gray-500 font-medium max-w-[180px] leading-tight">{schoolAddress}</p>
                                </div>
                                <div className="text-right"><div className="h-6 w-16 bg-gray-800 opacity-80 ml-auto flex items-center justify-center text-[5px] text-white tracking-widest">BARCODE</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="h-2 bg-indigo-600 w-full shrink-0"></div>
                </div>
            );
        }
        
        return (
             <div id="id-card-content-profile" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col justify-center items-center">
                 <p className="text-gray-500">Design Preview {currentIdCardDesign + 1}</p>
                 <p className="text-xs text-gray-400 text-center px-4">Switch designs to see variations</p>
             </div>
        );
    };

    // Actions Definition using Emojis
    const profileActions = [
        { icon: '💳', label: 'Pay', onClick: () => { 
            if (onNavigateToFees && student) {
                onNavigateToFees(student.id);
            } else {
                setSelectedPayment(null); 
                setIsPayModalOpen(true); 
            }
        }, color: 'text-green-600', ring: 'group-hover/btn:ring-green-200', role: UserRole.ADMIN },
        { icon: '👨‍👩‍👧‍👦', label: 'Group', onClick: handleGroupClick, color: 'text-purple-600', ring: 'group-hover/btn:ring-purple-200', role: 'ALL' },
        { icon: '📞', label: 'Call', onClick: handleCallParent, color: 'text-teal-600', ring: 'group-hover/btn:ring-teal-200', role: 'ALL' }
    ];

    const visibleActions = profileActions.filter(action => action.role === 'ALL' || action.role === userRole);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto pb-10">
            {/* --- Navigation Bar --- */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👨‍🎓 Student Profile</h1>
            </div>

            {/* --- Hero Section --- */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-900 dark:to-purple-900 relative">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>
                
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="-mt-12">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    {student.avatar ? (
                                        <img src={student.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        student.name.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 pt-4 md:pt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {student.name}
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${financialSummary.totalDue > 0 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                            {financialSummary.totalDue > 0 ? '❌ Payment Due' : '✅ Active'}
                                        </span>
                                    </h2>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" /> 🆔 ID: <span className="font-mono text-gray-700 dark:text-gray-300">{student.id}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <GraduationCap className="w-3.5 h-3.5" /> 🎓 Class: <span className="font-medium text-gray-700 dark:text-gray-300">{student.grade}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> 👨‍👩‍👧‍👦 Parent: <span className="font-medium text-gray-700 dark:text-gray-300">{student.parentName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Info & Stats Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Personal Info & Actions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-500" /> 👤 Personal Details
                            </h3>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">🎂 Date of Birth</span>
                                <span className="font-medium text-gray-900 dark:text-white">{student.dob || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">📅 Admission Date</span>
                                <span className="font-medium text-gray-900 dark:text-white">{student.admissionDate || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">📞 Phone</span>
                                <span className="font-medium text-gray-900 dark:text-white">{student.contact}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-gray-500 dark:text-gray-400 block mb-1">📍 Address</span>
                                <p className="font-medium text-gray-900 dark:text-white leading-relaxed">{student.address || 'No address provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Quick Actions Row (Circular) */}
                    <div className="flex flex-wrap justify-between items-center gap-3 px-2 mt-4">
                        {visibleActions.map((action, idx) => (
                            <button 
                                key={idx}
                                onClick={action.onClick}
                                className="group/btn flex flex-col items-center gap-1 focus:outline-none transition-transform active:scale-95"
                            >
                                <div className={`
                                    w-9 h-9 rounded-full bg-white dark:bg-gray-800 
                                    shadow-md dark:shadow-none
                                    border border-gray-100 dark:border-gray-700
                                    flex items-center justify-center text-lg
                                    transition-all duration-300
                                    group-hover/btn:scale-110 group-hover/btn:-translate-y-1 group-hover/btn:shadow-lg
                                    group-focus/btn:ring-2 ${action.ring} dark:group-focus/btn:ring-gray-700
                                    ${action.color} dark:text-gray-200
                                `}>
                                    <span className="transform transition-transform duration-300 group-hover/btn:rotate-12">{action.icon}</span>
                                </div>
                                
                                <span className="
                                    text-[6px] font-bold uppercase tracking-wide
                                    text-gray-500 dark:text-gray-400
                                    bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full
                                    border border-gray-100 dark:border-gray-700
                                    transition-colors group-hover/btn:text-gray-900 dark:group-hover/btn:text-white
                                    group-hover/btn:border-gray-300 dark:group-hover/btn:border-gray-500
                                ">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Financials & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-500" /> 💰 Financial Overview
                                </h3>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded uppercase">📅 Session {student.session}</span>
                            </div>
                            {userRole === UserRole.ADMIN && (
                                <button 
                                    onClick={() => setIsFeeConfigModalOpen(true)} 
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none transition-colors"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Edit/Manage Fees
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-bold">💵 Total Fees</p>
                                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">₹{financialSummary.totalExpected.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold">✅ Paid</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">₹{financialSummary.totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                                <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold">❌ Due</p>
                                <p className="text-2xl font-bold text-red-900 dark:text-red-100">₹{financialSummary.totalDue.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Fee Structure Breakdown */}
                        <div className="space-y-3">
                            {financialSummary.feeDetails.map((fee: any) => (
                                <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{fee.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">⏰ Due: {fee.dueDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">₹{fee.effectiveAmount.toLocaleString()}</p>
                                        {fee.balance > 0 ? (
                                            <p className="text-xs text-red-600 font-bold">Due: ₹{fee.balance}</p>
                                        ) : (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">✅ Paid</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment History (New Card Layout) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" /> 📜 Payment History
                        </h3>
                        {payments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {payments.map(payment => {
                                    const fee = fees.find(f => f.id === payment.feeStructureId);
                                    const styles = getCardStyles(getPaymentPercentage());
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
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold truncate ${styles.text}`} title={student.name}>
                                                        {student.name}
                                                    </h4>
                                                    <p className={`text-xs truncate ${styles.subtext}`}>
                                                        ID: {student.id} • Class {student.grade}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className={`pt-3 border-t flex items-end justify-between border-current/10`}>
                                                <div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${styles.subtext}`}>🏷️ Paid For</p>
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
                                                    { icon: <Eye className="w-4 h-4" />, label: 'Receipt', onClick: () => handleViewReceipt(payment), color: 'text-blue-600', ring: 'group-hover/btn:ring-blue-200', role: 'ALL' },
                                                    { icon: <Edit className="w-4 h-4" />, label: 'Edit', onClick: () => handleEditPayment(payment), color: 'text-indigo-600', ring: 'group-hover/btn:ring-indigo-200', role: UserRole.ADMIN },
                                                    { icon: <Trash2 className="w-4 h-4" />, label: 'Delete', onClick: () => handleDeletePayment(payment), color: 'text-red-600', ring: 'group-hover/btn:ring-red-200', role: UserRole.ADMIN }
                                                ].filter(action => action.role === 'ALL' || action.role === userRole).map((action, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={(e) => { e.stopPropagation(); action.onClick(); }}
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
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                No payment records found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ADD / EDIT STUDENT MODAL --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Edit className="w-5 h-5" /> Edit Student Details
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-white/70 hover:text-white p-1 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleUpdateStudent} className="p-6 space-y-5">
                            <div className="flex justify-center mb-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                        {studentForm.avatar ? (
                                            <img src={studentForm.avatar} alt="Upload" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-2xl font-bold">{studentForm.name ? studentForm.name.charAt(0) : <User className="w-8 h-8 opacity-50" />}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handlePhotoUpload}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Name" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required />
                                <input className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Grade" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value})} required />
                            </div>
                            <input className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Parent Name" value={studentForm.parentName} onChange={e => setStudentForm({...studentForm, parentName: e.target.value})} required />
                            <input className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Contact" value={studentForm.contact} onChange={e => setStudentForm({...studentForm, contact: e.target.value})} required />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPayModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedPayment ? '✏️ Update Payment' : '💳 Record Payment'}
                            </h2>
                            <button onClick={() => { setIsPayModalOpen(false); setSelectedPayment(null); }}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSavePayment} className="space-y-4">
                            <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={paymentForm.feeId} onChange={e => setPaymentForm({...paymentForm, feeId: e.target.value})} required>
                                {student.feeStructureIds.map(fid => {
                                    const f = fees.find(fee => fee.id === fid);
                                    return f ? <option key={f.id} value={f.id}>{f.name} (₹{f.amount})</option> : null;
                                })}
                            </select>
                            <input type="number" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Amount" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required />
                            <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <input type="date" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} required />
                            <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg font-bold mt-2">
                                {selectedPayment ? 'Update' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- FEE CONFIGURATION MODAL --- */}
            {isFeeConfigModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ListPlus className="w-5 h-5" /> Manage Fees
                            </h2>
                            <button onClick={() => setIsFeeConfigModalOpen(false)} className="text-white/70 hover:text-white p-1 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveFeeStructure} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Category Name</label>
                                <input 
                                    required 
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" 
                                    placeholder="e.g. Lab Fee" 
                                    value={newFeeForm.name} 
                                    onChange={e => setNewFeeForm({...newFeeForm, name: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <input 
                                    required 
                                    type="number"
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" 
                                    placeholder="0.00" 
                                    value={newFeeForm.amount} 
                                    onChange={e => setNewFeeForm({...newFeeForm, amount: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                <input 
                                    required 
                                    type="date"
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" 
                                    value={newFeeForm.dueDate} 
                                    onChange={e => setNewFeeForm({...newFeeForm, dueDate: e.target.value})} 
                                />
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-gray-500 mb-4">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    This will create a new fee type globally and assign it to this student.
                                </p>
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all">
                                    Save & Assign Fee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🗑️ Delete Student?</h3>
                        <p className="text-gray-500 mb-6">Are you sure you want to delete this student? This will move them to the recycle bin.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold">Cancel</button>
                            <button onClick={handleDeleteStudent} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {isDeletePaymentModalOpen && selectedPayment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🗑️ Delete Payment?</h3>
                        <p className="text-gray-500 mb-6">Are you sure you want to delete this payment of <strong>₹{selectedPayment.amountPaid}</strong>? <br/> This will move it to the Recycle Bin.</p>
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
            )}

            {/* --- ID CARD MODAL (Preview & Download) --- */}
            {isIdCardModalOpen && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">ID Card Preview</h2>
                            <button onClick={() => setIsIdCardModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 flex items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                            <button onClick={prevDesign} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            {renderIdCard()}

                            <button onClick={nextDesign} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                             <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                 Design {currentIdCardDesign + 1} of 5
                             </div>
                             <button 
                                onClick={handleDownloadIdCard}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-colors"
                             >
                                <Download className="w-4 h-4" /> Download ID Card
                             </button>
                        </div>
                    </div>
                 </div>
            )}

            {/* --- RECEIPT MODAL --- */}
            {isReceiptModalOpen && selectedPayment && (() => {
                 // Define variables to fix undefined errors
                 const students = db.getStudents();
                 const currentSession = db.getSchoolProfile().currentSession;

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

export default StudentProfileView;
