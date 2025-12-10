
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Trash2, X, Save, AlertTriangle, ChevronDown, Edit, CreditCard, CheckCircle, Download, ChevronLeft, ChevronRight, Eye, Camera, Users } from 'lucide-react';
import { db } from '../services/db';
import { Student, UserRole, PaymentRecord, FeeStructure } from '../types';
import { FEE_STRUCTURES } from '../constants';
import { useNotification } from './NotificationProvider';

const getStudentStyles = (percentage: number) => {
    if (percentage >= 100) return {
        border: 'border-blue-500 dark:border-blue-400',
        bg: 'bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-blue-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700'
    };
    if (percentage >= 80) return {
        border: 'border-emerald-500 dark:border-emerald-400',
        bg: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
    };
    if (percentage >= 60) return {
        border: 'border-green-500 dark:border-green-400',
        bg: 'bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-green-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-green-500',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700'
    };
    if (percentage >= 40) return {
        border: 'border-yellow-500 dark:border-yellow-400',
        bg: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50/30 dark:from-yellow-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
    };
    if (percentage >= 20) return {
        border: 'border-orange-500 dark:border-orange-400',
        bg: 'bg-gradient-to-br from-orange-50 via-white to-orange-50/30 dark:from-orange-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700'
    };
    return {
        border: 'border-red-500 dark:border-red-400',
        bg: 'bg-gradient-to-br from-red-50 via-white to-red-50/30 dark:from-red-900/30 dark:via-gray-800 dark:to-gray-800',
        bar: 'bg-red-600',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700'
    };
};

interface StudentManagerProps {
    onNavigateToProfile?: (studentId: string) => void;
    onNavigateToParentProfile?: (studentId: string) => void;
    onNavigateToFees?: (studentId: string) => void;
    userRole?: UserRole;
}

const StudentManager: React.FC<StudentManagerProps> = ({ onNavigateToProfile, onNavigateToParentProfile, onNavigateToFees, userRole = UserRole.ADMIN }) => {
    const { showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [fees, setFees] = useState<FeeStructure[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('ALL');
    const [currentSession, setCurrentSession] = useState('');
    const [schoolAddress, setSchoolAddress] = useState('');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    
    // Modals State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    const [currentIdCardDesign, setCurrentIdCardDesign] = useState(0);
    
    // Edit & Selection State
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Delete Confirmation State
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [classToDeleteSelection, setClassToDeleteSelection] = useState<string>('');
    const [deleteClassError, setDeleteClassError] = useState<string>('');
    
    // New Class Form State
    const [newClassName, setNewClassName] = useState('');

    // Preview Mode State for Add Student
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Student Form State (Add/Edit)
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

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        feeId: '',
        method: 'Cash'
    });

    const PAYMENT_METHODS = ['Cash', 'UPI', 'Online Transfer', 'Cheque'];

    useEffect(() => {
        const profile = db.getSchoolProfile();
        setCurrentSession(profile.currentSession);
        setSchoolAddress(profile.address);
        setStudents(db.getStudents().filter(s => s.session === profile.currentSession));
        setClasses(db.getClasses());
        setFees(db.getFees().filter(f => f.session === profile.currentSession));
        setPayments(db.getPayments().filter(p => p.session === profile.currentSession));
    }, []);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.grade.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'ALL' || s.grade === selectedClass;
        return matchesSearch && matchesClass;
    });

    const getStudentStats = (student: Student) => {
        let total = 0;
        let paid = 0;
        let hasOverdue = false;
        const today = new Date().toISOString().split('T')[0];

        // Calculate Total
        if (student.totalClassFees && student.totalClassFees > 0) {
            total = student.totalClassFees;
        } else {
            student.feeStructureIds.forEach(fid => {
                const fee = fees.find(f => f.id === fid);
                if (fee) {
                    total += fee.amount;
                }
            });
        }

        if (student.backFees) {
            total += student.backFees;
        }

        // Calculate Overdue Status
        student.feeStructureIds.forEach(fid => {
            const fee = fees.find(f => f.id === fid);
            if (fee) {
                let effectiveFeeAmount = fee.amount;
                if (student.totalClassFees && student.totalClassFees > 0 && fid === student.feeStructureIds[0]) {
                    effectiveFeeAmount = student.totalClassFees;
                }

                const feePayments = payments.filter(p => p.studentId === student.id && p.feeStructureId === fid);
                const feePaidAmount = feePayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

                if (feePaidAmount < effectiveFeeAmount && fee.dueDate < today) {
                    hasOverdue = true;
                }
            }
        });

        const studentPayments = payments.filter(p => p.studentId === student.id);
        paid = studentPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

        const due = Math.max(0, total - paid);
        const percentage = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
        
        let status = 'PENDING';
        if (due === 0 && total > 0) status = 'PAID';
        else if (hasOverdue) status = 'OVERDUE';
        else if (paid > 0) status = 'PARTIAL';
        else if (due > 0) status = 'PENDING';

        return { total, paid, due, percentage, status };
    };

    const isFormValid = () => {
        return studentForm.name && studentForm.grade && studentForm.parentName && studentForm.contact;
    };

    // --- Actions Handlers ---

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

    const handleEditClick = (student: Student) => {
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
        setSelectedStudent(student);
        setIsEditMode(true);
        setIsPreviewMode(false);
        setIsModalOpen(true);
    };

    const handlePayClick = (student: Student) => {
        if (onNavigateToFees) {
            onNavigateToFees(student.id);
        } else {
            setSelectedStudent(student);
            setPaymentForm({
                amount: '',
                feeId: student.feeStructureIds.length > 0 ? student.feeStructureIds[0] : '',
                method: 'Cash'
            });
            setIsPaymentModalOpen(true);
        }
    };

    const handleGroupClick = (student: Student) => {
        if (onNavigateToParentProfile) {
            onNavigateToParentProfile(student.id);
        } else {
            alert(`Opening Parents Details for ${student.name}'s Guardians...`);
        }
    };

    const handleViewClick = (student: Student) => {
        if (onNavigateToProfile) {
            onNavigateToProfile(student.id);
        }
    };

    const handleIdCardClick = (student: Student) => {
        setSelectedStudent(student);
        setCurrentIdCardDesign(0); // Reset to first design
        setIsIdCardModalOpen(true);
    };

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student);
    };

    const handleSaveStudent = (e: React.FormEvent) => {
        e.preventDefault();
        
        // If not in preview mode and it's a new student, go to preview first
        if (!isEditMode && !isPreviewMode) {
            if (isFormValid()) {
                setIsPreviewMode(true);
            } else {
                showNotification("Please fill all required fields", "warning");
            }
            return;
        }

        const studentData = {
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

        if (isEditMode && selectedStudent) {
            const updatedStudent: Student = {
                ...selectedStudent,
                ...studentData
            };
            db.updateStudent(updatedStudent);
            showNotification(`Updated details for ${updatedStudent.name}`, 'success');
        } else {
            // Final Save after preview
            const student: Student = {
                id: db.generateStudentId(),
                role: UserRole.STUDENT,
                ...studentData,
                feeStructureIds: [FEE_STRUCTURES[0].id],
                session: currentSession
            };
            db.addStudent(student);
            showNotification(`Student ${student.name} added successfully`, 'success');
        }

        setStudents(db.getStudents().filter(s => s.session === currentSession));
        setIsModalOpen(false);
        setIsEditMode(false);
        setIsPreviewMode(false);
        setSelectedStudent(null);
        setStudentForm({ name: '', grade: '', parentName: '', contact: '', dob: '', address: '', totalClassFees: '', backFees: '', admissionDate: '', avatar: '' });
    };

    const handleSavePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudent && paymentForm.amount && paymentForm.feeId) {
            const newPayment: PaymentRecord = {
                id: `P${Date.now()}`,
                studentId: selectedStudent.id,
                feeStructureId: paymentForm.feeId,
                amountPaid: parseFloat(paymentForm.amount),
                date: new Date().toISOString().split('T')[0],
                method: paymentForm.method,
                session: currentSession
            };
            db.addPayment(newPayment);
            setPayments(db.getPayments().filter(p => p.session === currentSession));
            showNotification(`Payment of ₹${paymentForm.amount} recorded for ${selectedStudent.name}`, 'success');
            setIsPaymentModalOpen(false);
            setSelectedStudent(null);
        }
    };

    const confirmDelete = () => {
        if (studentToDelete) {
            // Check for existing payments for this student
            const studentPayments = db.getPayments().filter(p => p.studentId === studentToDelete.id);
            
            if (studentPayments.length > 0) {
                showNotification(`Cannot delete ${studentToDelete.name}. They have ${studentPayments.length} recorded payment(s).`, 'error');
                setStudentToDelete(null);
                return;
            }

            db.deleteStudent(studentToDelete.id);
            setStudents(db.getStudents().filter(s => s.session === currentSession));
            showNotification(`Student ${studentToDelete.name} moved to Recycle Bin`, 'success');
            setStudentToDelete(null);
        }
    };

    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault();
        if(newClassName.trim()) {
            db.addClass(newClassName.trim());
            setClasses(db.getClasses());
            showNotification(`Class ${newClassName.trim()} added`, 'success');
            setNewClassName('');
            setIsAddClassModalOpen(false);
        }
    };

    const handleDeleteClassIconClick = () => {
        if (classes.length > 0) {
            setClassToDeleteSelection(classes[0]);
            setDeleteClassError('');
            setIsDeleteClassModalOpen(true);
        }
    };

    const confirmDeleteClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (classToDeleteSelection) {
            const allStudents = db.getStudents();
            const studentsInClass = allStudents.filter(s => s.grade === classToDeleteSelection);

            if (studentsInClass.length > 0) {
                setDeleteClassError(`Cannot delete class. There are ${studentsInClass.length} student(s) enrolled in this class. Please delete the students first.`);
                return;
            }

            db.deleteClass(classToDeleteSelection);
            setClasses(db.getClasses());
            
            if (selectedClass === classToDeleteSelection) {
                setSelectedClass('ALL');
            }
            showNotification(`Class ${classToDeleteSelection} deleted`, 'success');
            setIsDeleteClassModalOpen(false);
            setClassToDeleteSelection('');
            setDeleteClassError('');
        }
    };

    const openAddModal = () => {
        setStudentForm({ name: '', grade: '', parentName: '', contact: '', dob: '', address: '', totalClassFees: '', backFees: '', admissionDate: '', avatar: '' });
        setIsEditMode(false);
        setIsPreviewMode(false);
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleDownloadIdCard = async () => {
        const element = document.getElementById('id-card-content');
        if (!element) return;
        
        try {
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
                alert("Image generation library not loaded.");
                return;
            }
            // Temporarily remove shadow for clean capture
            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = 'none';
            
            const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null });
            
            // Restore shadow
            element.style.boxShadow = originalShadow;

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `ID_Card_${selectedStudent?.name || 'Student'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification("ID Card downloaded successfully", 'success');
        } catch (err) {
            console.error("Failed to generate ID card", err);
            showNotification("Failed to generate ID card.", 'error');
        }
    };

    const nextDesign = () => {
        setCurrentIdCardDesign((prev) => (prev + 1) % 5);
    };

    const prevDesign = () => {
        setCurrentIdCardDesign((prev) => (prev - 1 + 5) % 5);
    };

    const renderIdCard = () => {
        // ... (ID Card rendering logic remains the same)
        if (!selectedStudent) return null;

        const commonContent = (
            <>
                <div className="space-y-1.5 text-left text-[10px]">
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">ID No</span> <span className="font-bold">{selectedStudent.id}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Class</span> <span className="font-bold">{selectedStudent.grade}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Guardian</span> <span className="font-bold truncate max-w-[120px]">{selectedStudent.parentName}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">DOB</span> <span className="font-bold">{selectedStudent.dob || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-current/20 pb-0.5"><span className="font-bold uppercase opacity-70">Phone</span> <span className="font-bold">{selectedStudent.contact}</span></div>
                </div>
            </>
        );

        // DESIGN 1: Classic Blue
        if (currentIdCardDesign === 0) {
            return (
                <div id="id-card-content" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col">
                    <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-600 relative shrink-0">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        <div className="absolute top-4 left-0 w-full text-center text-white">
                            <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">The Education Hills</h3>
                            <p className="text-[10px] opacity-80">Knowledge Is Power</p>
                        </div>
                    </div>
                    <div className="px-6 pb-6 pt-0 relative text-center flex-1 flex flex-col">
                        <div className="-mt-10 mb-3 flex justify-center">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden uppercase">
                                    {selectedStudent.avatar ? (
                                        <img src={selectedStudent.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        selectedStudent.name.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{selectedStudent.name}</h2>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-6">Student</p>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 flex-1">
                            {commonContent}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 shrink-0">
                            <div className="flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">Session</p>
                                    <p className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1">{currentSession}</p>
                                    <p className="text-[8px] text-gray-500 font-medium max-w-[180px] leading-tight">{schoolAddress}</p>
                                </div>
                                <div className="text-right">
                                    <div className="h-6 w-16 bg-gray-800 opacity-80 ml-auto flex items-center justify-center text-[5px] text-white tracking-widest">BARCODE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-2 bg-indigo-600 w-full shrink-0"></div>
                </div>
            );
        }
        // Design 2: Modern Dark
        if (currentIdCardDesign === 1) {
            return (
                <div id="id-card-content" className="w-[300px] h-[480px] bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden relative flex flex-col text-white">
                    <div className="h-32 bg-gradient-to-br from-amber-500 to-orange-600 relative shrink-0 clip-path-slant">
                        <div className="absolute top-4 left-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider">Education Hills</h3>
                        </div>
                    </div>
                    <div className="px-6 relative text-center flex-1 flex flex-col -mt-16">
                        <div className="mb-4 flex justify-center">
                            <div className="w-24 h-24 bg-slate-900 rounded-full p-1.5">
                                <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden uppercase border-2 border-amber-500">
                                    {selectedStudent.avatar ? (
                                        <img src={selectedStudent.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        selectedStudent.name.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold mb-1">{selectedStudent.name}</h2>
                        <p className="text-xs text-amber-500 uppercase tracking-widest mb-6">Student ID Card</p>

                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-slate-300 flex-1 text-left">
                             <div className="space-y-2 text-[10px]">
                                <div className="grid grid-cols-3 border-b border-slate-700 pb-1"><span className="text-slate-500 font-bold uppercase">ID</span> <span className="col-span-2 font-bold text-white">{selectedStudent.id}</span></div>
                                <div className="grid grid-cols-3 border-b border-slate-700 pb-1"><span className="text-slate-500 font-bold uppercase">Class</span> <span className="col-span-2 font-bold text-white">{selectedStudent.grade}</span></div>
                                <div className="grid grid-cols-3 border-b border-slate-700 pb-1"><span className="text-slate-500 font-bold uppercase">Parent</span> <span className="col-span-2 font-bold text-white">{selectedStudent.parentName}</span></div>
                                <div className="grid grid-cols-3 border-b border-slate-700 pb-1"><span className="text-slate-500 font-bold uppercase">DOB</span> <span className="col-span-2 font-bold text-white">{selectedStudent.dob || '-'}</span></div>
                                <div className="grid grid-cols-3 border-b border-slate-700 pb-1"><span className="text-slate-500 font-bold uppercase">Contact</span> <span className="col-span-2 font-bold text-white">{selectedStudent.contact}</span></div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-2 border-t border-slate-800 shrink-0 flex justify-between items-center">
                             <p className="text-[8px] text-slate-500">{schoolAddress}</p>
                             <span className="text-[8px] font-bold bg-slate-800 px-2 py-1 rounded text-amber-500">{currentSession}</span>
                        </div>
                    </div>
                </div>
            );
        }
        // Design 3: Professional White
        if (currentIdCardDesign === 2) {
            return (
                <div id="id-card-content" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex">
                    <div className="w-8 bg-emerald-600 h-full shrink-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold tracking-widest -rotate-90 whitespace-nowrap uppercase">Education Hills Campus</span>
                    </div>
                    <div className="flex-1 p-5 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xl">EH</div>
                            <div className="text-right">
                                <h3 className="text-xs font-bold uppercase text-gray-800">Identity Card</h3>
                                <p className="text-[8px] text-gray-500">{currentSession}</p>
                            </div>
                        </div>
                        
                        <div className="w-28 h-28 mx-auto bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-3xl text-gray-400 font-bold border border-gray-200 overflow-hidden">
                             {selectedStudent.avatar ? (
                                <img src={selectedStudent.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                selectedStudent.name.charAt(0)
                            )}
                        </div>
                        
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900 uppercase">{selectedStudent.name}</h2>
                            <p className="text-xs text-emerald-600 font-medium">{selectedStudent.id}</p>
                        </div>

                        <div className="space-y-2 text-[10px] text-gray-600 flex-1">
                            <div className="flex"><span className="w-16 font-bold uppercase text-gray-400">Class</span> <span>{selectedStudent.grade}</span></div>
                            <div className="flex"><span className="w-16 font-bold uppercase text-gray-400">Parent</span> <span>{selectedStudent.parentName}</span></div>
                            <div className="flex"><span className="w-16 font-bold uppercase text-gray-400">Phone</span> <span>{selectedStudent.contact}</span></div>
                            <div className="flex"><span className="w-16 font-bold uppercase text-gray-400">Address</span> <span className="truncate">{selectedStudent.address || 'N/A'}</span></div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-gray-100 text-[8px] text-center text-gray-400">
                            {schoolAddress}
                        </div>
                    </div>
                </div>
            );
        }
        // Design 4: Elegant Purple
        if (currentIdCardDesign === 3) {
            return (
                <div id="id-card-content" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col">
                    <div className="h-40 bg-purple-900 relative shrink-0 rounded-b-[50%] -mx-6 flex items-center justify-center">
                        <div className="text-center text-white -mt-10">
                            <div className="w-10 h-10 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center backdrop-blur-md">🎓</div>
                            <h3 className="text-sm font-bold uppercase tracking-widest">Education Hills</h3>
                        </div>
                    </div>
                    <div className="-mt-16 px-6 relative text-center flex-1 flex flex-col">
                        <div className="mx-auto w-28 h-28 rounded-full p-1 bg-white shadow-lg mb-3">
                            <div className="w-full h-full rounded-full bg-purple-50 flex items-center justify-center text-3xl font-bold text-purple-400 overflow-hidden">
                                {selectedStudent.avatar ? (
                                    <img src={selectedStudent.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    selectedStudent.name.charAt(0)
                                )}
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                        <span className="inline-block mx-auto px-3 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase mb-6">Student</span>

                        <div className="grid grid-cols-2 gap-3 text-left text-[10px] text-gray-600 bg-purple-50/50 p-4 rounded-xl mb-4">
                            <div>
                                <p className="text-purple-300 font-bold uppercase text-[8px]">ID Number</p>
                                <p className="font-semibold">{selectedStudent.id}</p>
                            </div>
                            <div>
                                <p className="text-purple-300 font-bold uppercase text-[8px]">Grade</p>
                                <p className="font-semibold">{selectedStudent.grade}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-purple-300 font-bold uppercase text-[8px]">Guardian</p>
                                <p className="font-semibold">{selectedStudent.parentName}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-purple-300 font-bold uppercase text-[8px]">Contact</p>
                                <p className="font-semibold">{selectedStudent.contact}</p>
                            </div>
                        </div>
                        
                        <div className="mt-auto text-[8px] text-gray-400 pb-4">
                            Authorized Student Card • {currentSession}
                        </div>
                    </div>
                </div>
            );
        }
        // Design 5: Creative Orange
        return (
            <div id="id-card-content" className="w-[300px] h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-bl-full z-0 opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 rounded-tr-full z-0 opacity-20"></div>
                
                <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg text-gray-800 leading-tight">The<br/>Education<br/>Hills.</h3>
                        <div className="text-right">
                            <p className="text-[8px] uppercase font-bold text-gray-400">Session</p>
                            <p className="text-xs font-bold text-orange-500">{currentSession}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-4 flex items-center justify-center text-4xl text-gray-300 font-bold border-2 border-dashed border-gray-300 overflow-hidden">
                            {selectedStudent.avatar ? (
                                <img src={selectedStudent.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                selectedStudent.name.charAt(0)
                            )}
                        </div>
                        
                        <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedStudent.name.split(' ')[0]}</h2>
                        <h2 className="text-xl font-medium text-gray-500 mb-4">{selectedStudent.name.split(' ').slice(1).join(' ')}</h2>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                <p className="text-xs font-bold text-gray-800">ID: {selectedStudent.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                <p className="text-xs font-bold text-gray-800">Class: {selectedStudent.grade}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                <p className="text-xs text-gray-600">{selectedStudent.parentName}</p>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                <p className="text-xs text-gray-600">{selectedStudent.contact}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                        <div className="text-[8px] text-gray-400 max-w-[150px]">
                            {schoolAddress}
                        </div>
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[6px] font-bold rounded">QR</div>
                    </div>
                </div>
            </div>
        );
    };

    // Filter available actions based on Role
    const getAvailableActions = (student: Student) => {
        const allActions = [
            { icon: '✏️', label: 'Edit', onClick: handleEditClick, color: 'text-indigo-600', ring: 'group-hover/btn:ring-indigo-200', role: UserRole.ADMIN },
            { icon: '💳', label: 'Pay', onClick: handlePayClick, color: 'text-green-600', ring: 'group-hover/btn:ring-green-200', role: UserRole.ADMIN },
            { icon: '🪪', label: 'ID Card', onClick: handleIdCardClick, color: 'text-sky-600', ring: 'group-hover/btn:ring-sky-200', role: 'ALL' },
            { icon: '👤', label: 'Profile', onClick: handleViewClick, color: 'text-blue-600', ring: 'group-hover/btn:ring-blue-200', role: 'ALL' },
            { icon: '👨‍👩‍👧‍👦', label: 'Group', onClick: handleGroupClick, color: 'text-purple-600', ring: 'group-hover/btn:ring-purple-200', role: 'ALL' },
            { icon: '🗑️', label: 'Delete', onClick: handleDeleteClick, color: 'text-red-600', ring: 'group-hover/btn:ring-red-200', role: UserRole.ADMIN }
        ];

        return allActions.filter(action => action.role === 'ALL' || action.role === userRole);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👨‍🎓 Student Manager</h1>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                        Session: {currentSession}
                    </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage student records for the current academic session</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sticky top-0 z-10">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="🔍 Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <div className="relative">
                            <select 
                                value={selectedClass} 
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[110px]"
                            >
                                <option value="ALL">All Classes</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown className="h-3 w-3" />
                            </div>
                        </div>

                        {userRole === UserRole.ADMIN && (
                            <>
                                <button 
                                    onClick={() => setIsAddClassModalOpen(true)}
                                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                                    title="Add New Class"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>

                                <button 
                                    onClick={handleDeleteClassIconClick}
                                    className={`p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-100 dark:border-red-800 ${classes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Delete a Class"
                                    disabled={classes.length === 0}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                                <button 
                                    onClick={openAddModal}
                                    className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm text-sm whitespace-nowrap"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Student
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                    {filteredStudents.map((student) => {
                        const stats = getStudentStats(student);
                        const isExpanded = expandedStudentId === student.id;
                        const styles = getStudentStyles(stats.percentage);
                        const badgeStyle = stats.status === 'OVERDUE' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700' 
                            : styles.badge;
                        
                        const actions = getAvailableActions(student);

                        return (
                            <div 
                                key={student.id} 
                                onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                                className={`group relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${styles.border} ${styles.bg} ${
                                    isExpanded
                                    ? 'shadow-xl translate-y-[-4px]' 
                                    : 'hover:shadow-lg hover:translate-y-[-2px]'
                                }`}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-gray-700 dark:text-gray-200 text-xl font-bold shadow-sm backdrop-blur-sm border border-white/40 dark:border-white/10 overflow-hidden">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0)
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug truncate pr-2 max-w-[140px]" title={student.name}>{student.name}</h3>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200 dark:border-gray-600 uppercase tracking-wide">
                                                        {student.grade}
                                                    </span>
                                                    <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100 dark:border-indigo-800 uppercase tracking-wide">
                                                        ID: {student.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeStyle}`}>
                                            {stats.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 font-medium">
                                        <div className="flex items-center gap-2 bg-white/40 dark:bg-black/20 px-2 py-1.5 rounded-lg backdrop-blur-sm">
                                           <span className="text-sm">👨‍👩‍👦</span>
                                           <span className="truncate max-w-[90px]" title={student.parentName}>{student.parentName}</span>
                                        </div>
                                        <a 
                                            href={`tel:${student.contact}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 bg-white/40 dark:bg-black/20 px-2 py-1.5 rounded-lg backdrop-blur-sm hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                            title="Call Parent"
                                        >
                                           <span className="text-sm">📞</span>
                                           <span>{student.contact}</span>
                                        </a>
                                    </div>

                                    {/* Glassmorphism Financial Card */}
                                    <div className="mt-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-3 border border-white/60 dark:border-gray-700/50 shadow-sm relative z-10">
                                        <div className="flex justify-between items-center mb-2">
                                           <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Fee Progress</span>
                                           <span className="text-xs font-bold text-gray-900 dark:text-white">{Math.round(stats.percentage)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden mb-3">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} 
                                                style={{width: `${stats.percentage}%`}}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                             <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-[9px] uppercase font-bold tracking-wider opacity-80">Total</span>
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">₹{stats.total.toLocaleString()}</p>
                                             </div>
                                             <div className="text-center">
                                                <span className="text-gray-500 dark:text-gray-400 block text-[9px] uppercase font-bold tracking-wider opacity-80">Paid</span>
                                                <span className="font-bold text-green-700 dark:text-green-400 text-sm">₹{stats.paid.toLocaleString()}</p>
                                             </div>
                                             <div className="text-right">
                                                <span className="text-gray-500 dark:text-gray-400 block text-[9px] uppercase font-bold tracking-wider opacity-80">Due</span>
                                                <span className={`font-bold text-sm ${stats.due > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    ₹{stats.due.toLocaleString()}
                                                </span>
                                             </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Actions */}
                                <div className={`
                                    flex items-start justify-center gap-3
                                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top overflow-hidden
                                    ${isExpanded ? 'max-h-40 opacity-100 pt-4 pb-6' : 'max-h-0 opacity-0 py-0'}
                                `}>
                                    {actions.map((action, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); action.onClick(student); }}
                                            style={{ transitionDelay: isExpanded ? `${idx * 75}ms` : '0ms' }}
                                            className={`
                                                group/btn flex flex-col items-center gap-1 focus:outline-none
                                                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                                ${isExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'}
                                            `}
                                        >
                                            <div className={`
                                                w-9 h-9 rounded-full bg-white dark:bg-gray-800 
                                                shadow-sm dark:shadow-none
                                                border border-gray-100 dark:border-gray-700
                                                flex items-center justify-center text-lg
                                                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                                group-hover/btn:scale-110 group-hover/btn:-translate-y-1 group-hover/btn:shadow-md
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
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed p-12 text-center text-gray-400">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No students found matching your search 😕</p>
                    <p className="text-sm">Try adjusting your filters or add a new student.</p>
                </div>
            )}

            {/* --- ADD / EDIT STUDENT MODAL --- */}
            {isModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-indigo-800 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {isEditMode ? <Edit className="w-5 h-5" /> : (isPreviewMode ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                                {isEditMode ? 'Edit Student Details' : (isPreviewMode ? 'Review Student Details' : 'Add New Student')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        {isPreviewMode && !isEditMode ? (
                            <div className="p-6">
                                <div className="flex justify-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-indigo-500 shadow-md">
                                        {studentForm.avatar ? (
                                            <img src={studentForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">{studentForm.name.charAt(0)}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Student Information</h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">Full Name</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.name}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">Class/Grade</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.grade}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">Guardian</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.parentName}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">Contact</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.contact}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">DOB</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.dob}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400 text-xs">Admission</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.admissionDate}</p></div>
                                        <div className="col-span-2"><p className="text-gray-500 dark:text-gray-400 text-xs">Address</p><p className="font-bold text-gray-900 dark:text-white">{studentForm.address}</p></div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-4 border-b border-indigo-200 dark:border-indigo-800 pb-2">Financials</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><p className="text-indigo-500 dark:text-indigo-400 text-xs">Total Fees</p><p className="font-bold text-indigo-900 dark:text-indigo-100">₹{studentForm.totalClassFees || 'Default'}</p></div>
                                        <div><p className="text-indigo-500 dark:text-indigo-400 text-xs">Back Fees</p><p className="font-bold text-indigo-900 dark:text-indigo-100">₹{studentForm.backFees || '0'}</p></div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsPreviewMode(false)}
                                        className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors"
                                    >
                                        Back to Edit
                                    </button>
                                    <button 
                                        onClick={handleSaveStudent}
                                        className="flex-1 px-4 py-3 text-white bg-green-600 rounded-xl hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all hover:scale-[1.02]"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Save Student
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveStudent} className="p-6 space-y-5">
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

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">👤 Full Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        value={studentForm.name}
                                        placeholder="e.g. Rahul Kumar"
                                        onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">🎓 Grade/Class</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                                                value={studentForm.grade}
                                                onChange={e => setStudentForm({...studentForm, grade: e.target.value})}
                                            >
                                                <option value="" disabled>Select Grade</option>
                                                {classes.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">📞 Contact</label>
                                        <input 
                                            required
                                            type="tel" 
                                            className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={studentForm.contact}
                                            placeholder="Mobile Number"
                                            onChange={e => setStudentForm({...studentForm, contact: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">👨‍👩‍👦 Guardian Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={studentForm.parentName}
                                        placeholder="Father/Mother Name"
                                        onChange={e => setStudentForm({...studentForm, parentName: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">🎂 Date of Birth</label>
                                        <input 
                                            required
                                            type="date" 
                                            className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={studentForm.dob}
                                            onChange={e => setStudentForm({...studentForm, dob: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">📅 Date of Admission</label>
                                        <input 
                                            required
                                            type="date" 
                                            className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={studentForm.admissionDate}
                                            onChange={e => setStudentForm({...studentForm, admissionDate: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">📍 Full Address</label>
                                    <textarea 
                                        required
                                        rows={2}
                                        className="w-full text-gray-900 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                        value={studentForm.address}
                                        placeholder="Residential Address..."
                                        onChange={e => setStudentForm({...studentForm, address: e.target.value})}
                                    />
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> Financial Setup
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">💰 Total Fees</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                                <input 
                                                    required
                                                    type="number" 
                                                    className="w-full text-gray-900 pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                                    value={studentForm.totalClassFees}
                                                    placeholder="0.00"
                                                    onChange={e => setStudentForm({...studentForm, totalClassFees: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-wide">🔙 Back Fees <span className="text-gray-400 font-normal normal-case">(Optional)</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full text-gray-900 pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                                                    value={studentForm.backFees}
                                                    placeholder="0.00"
                                                    onChange={e => setStudentForm({...studentForm, backFees: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 px-4 py-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
                                    >
                                        {isEditMode ? <><Save className="w-5 h-5"/> Update Student</> : <><Eye className="w-5 h-5"/> Preview</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* --- RECORD PAYMENT MODAL --- */}
            {isPaymentModalOpen && selectedStudent && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* ... Modal content ... */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600" /> Record Payment
                            </h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                             <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Student</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.name}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                                <select 
                                    required
                                    className="w-full text-gray-900 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={paymentForm.feeId}
                                    onChange={e => setPaymentForm({...paymentForm, feeId: e.target.value})}
                                >
                                    {selectedStudent.feeStructureIds.map(fid => {
                                        const fee = fees.find(f => f.id === fid);
                                        const effectiveAmount = (selectedStudent.totalClassFees && selectedStudent.totalClassFees > 0 && fid === selectedStudent.feeStructureIds[0]) 
                                            ? selectedStudent.totalClassFees 
                                            : fee?.amount;
                                        
                                        return fee ? <option key={fee.id} value={fee.id}>{fee.name} (Total: {effectiveAmount})</option> : null;
                                    })}
                                </select>
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Paid</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input 
                                        required
                                        type="number" 
                                        min="1"
                                        className="w-full text-gray-900 pl-7 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_METHODS.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setPaymentForm({...paymentForm, method: m})}
                                            className={`py-2 text-xs font-bold rounded-lg border ${
                                                paymentForm.method === m 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                                : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-3 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" /> Confirm Payment
                            </button>
                        </form>
                     </div>
                </div>
            )}
            
            {/* --- ADD CLASS MODAL --- */}
            {isAddClassModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* ... Modal Content ... */}
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-indigo-800 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5"/> Add New Class</h2>
                            <button onClick={() => setIsAddClassModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddClass} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full text-gray-900 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g. 11th"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Add Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

             {/* --- DELETE CLASS MODAL --- */}
             {isDeleteClassModalOpen && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* ... Modal content ... */}
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Class?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Select class to delete. This cannot be undone if students are enrolled.
                            </p>
                            
                            {deleteClassError && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg mb-4 text-left">
                                    {deleteClassError}
                                </div>
                            )}

                            <div className="mb-6">
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none"
                                    value={classToDeleteSelection}
                                    onChange={(e) => setClassToDeleteSelection(e.target.value)}
                                >
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {setIsDeleteClassModalOpen(false); setDeleteClassError('');}}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteClass}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION --- */}
            {studentToDelete && userRole === UserRole.ADMIN && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Student?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete <strong>{studentToDelete.name}</strong>?
                                <br/><br/>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">This item will be moved to the Recycle Bin.</span>
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setStudentToDelete(null)}
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

            {/* --- ID CARD MODAL (Preview & Download) --- */}
            {isIdCardModalOpen && selectedStudent && (
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

        </div>
    );
};

export default StudentManager;
