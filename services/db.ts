
import { Student, PaymentRecord, FeeStructure, User, UserRole, SchoolProfile, Expense, TrashItem } from '../types';
import { MOCK_STUDENTS, MOCK_PAYMENTS, FEE_STRUCTURES, MOCK_USERS, MOCK_EXPENSES } from '../constants';

const KEYS = {
  STUDENTS: 'eh_students_v2',
  PAYMENTS: 'eh_payments_v2',
  FEES: 'eh_fees_v2',
  SCHOOL_PROFILE: 'eh_school_profile_v2',
  EXPENSES: 'eh_expenses_v2',
  CLASSES: 'eh_classes_v2',
  TRASH: 'eh_trash_v2',
  USERS: 'eh_users_v2' // New key for Admin/Staff persistence
};

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'The Education Hills 🎓',
  tagline: 'Knowledge Is Power ✨',
  address: '123 Academic Avenue, Knowledge City, ED 54321',
  website: 'www.educationhills.edu',
  phone: '+1 (555) 123-4567',
  sessions: ['2022-2023', '2023-2024', '2024-2025'],
  currentSession: '2024-2025',
  logo: '', 
  backgroundImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  affiliation: 'CBSE Board',
  institutionType: 'Co-Education',
  feesReceiptTerms: '1. Fees once paid are not refundable.\n2. Please keep this receipt safely for future reference.\n3. Cheques are subject to realization.',
  sliderImages: [
    {
      id: '1',
      url: "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Empowering Future Leaders",
      subtitle: "Excellence in Education Since 1995"
    },
    {
      id: '2',
      url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "State-of-the-Art Library",
      subtitle: "Knowledge at your fingertips"
    },
    {
      id: '3',
      url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Modern Classrooms",
      subtitle: "Technology driven learning environment"
    }
  ]
};

const DEFAULT_CLASSES = ['8th', '9th', '10th', '11th', '12th'];

const getFromStorage = <T>(key: string, defaultData: T): T => {
  if (typeof window === 'undefined') return defaultData;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultData;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    // Check for QuotaExceededError
    if (e.name === 'QuotaExceededError' || e.code === 22) {
       alert(`Storage Quota Exceeded!\n\nThe application cannot save more data to ${key}. This is often caused by storing too many large images.\n\nPlease delete some old data or try to use smaller images.`);
    }
    console.error(`Error saving ${key}`, e);
  }
};

export const db = {
  init: () => {
    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(KEYS.STUDENTS)) saveToStorage(KEYS.STUDENTS, MOCK_STUDENTS);
        if (!localStorage.getItem(KEYS.PAYMENTS)) saveToStorage(KEYS.PAYMENTS, MOCK_PAYMENTS);
        if (!localStorage.getItem(KEYS.FEES)) saveToStorage(KEYS.FEES, FEE_STRUCTURES);
        if (!localStorage.getItem(KEYS.SCHOOL_PROFILE)) saveToStorage(KEYS.SCHOOL_PROFILE, DEFAULT_SCHOOL_PROFILE);
        if (!localStorage.getItem(KEYS.EXPENSES)) saveToStorage(KEYS.EXPENSES, MOCK_EXPENSES);
        if (!localStorage.getItem(KEYS.CLASSES)) saveToStorage(KEYS.CLASSES, DEFAULT_CLASSES);
        if (!localStorage.getItem(KEYS.TRASH)) saveToStorage(KEYS.TRASH, []);
        
        // Initialize Staff/Admin Users if not present
        if (!localStorage.getItem(KEYS.USERS)) {
             const initialStaff = MOCK_USERS.filter(u => u.role !== UserRole.STUDENT);
             saveToStorage(KEYS.USERS, initialStaff);
        }
    }
  },

  getStudents: (): Student[] => getFromStorage(KEYS.STUDENTS, MOCK_STUDENTS),
  
  // ID Generator
  generateStudentId: () => {
    const students = db.getStudents();
    const numbers = students
        .map(s => {
            const match = s.id.match(/^ST(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        });
    const max = Math.max(0, ...numbers);
    return `ST${(max + 1).toString().padStart(3, '0')}`;
  },

  addStudent: (student: Student) => {
    const list = db.getStudents();
    list.push(student);
    saveToStorage(KEYS.STUDENTS, list);
  },

  updateStudent: (updatedStudent: Student) => {
    const list = db.getStudents();
    const index = list.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        list[index] = updatedStudent;
        saveToStorage(KEYS.STUDENTS, list);
    }
  },

  deleteStudent: (id: string) => {
    let list = db.getStudents();
    const student = list.find(s => s.id === id);
    if (student) {
        // Move to trash
        db.addToTrash({
            id: `T_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'STUDENT',
            originalId: id,
            data: student,
            deletedAt: new Date().toISOString(),
            description: `Student: ${student.name} (${student.grade})`
        });
        
        list = list.filter(s => s.id !== id);
        saveToStorage(KEYS.STUDENTS, list);
    }
  },

  // --- User Management (Admin/Staff/Student Unified) ---
  getStaffUsers: (): User[] => getFromStorage(KEYS.USERS, MOCK_USERS.filter(u => u.role !== UserRole.STUDENT)),

  updateUser: (updatedUser: User) => {
      // Check if it's a student
      if (updatedUser.role === UserRole.STUDENT) {
          db.updateStudent(updatedUser as Student);
      } else {
          // It's staff/admin
          const list = db.getStaffUsers();
          const index = list.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
              list[index] = updatedUser;
              saveToStorage(KEYS.USERS, list);
          }
      }
  },

  getAllUsers: (): User[] => {
    // Combine staff from storage and students from storage
    return [...db.getStaffUsers(), ...db.getStudents()];
  },

  getPayments: (): PaymentRecord[] => getFromStorage(KEYS.PAYMENTS, MOCK_PAYMENTS),

  addPayment: (payment: PaymentRecord) => {
    const list = db.getPayments();
    list.push(payment);
    saveToStorage(KEYS.PAYMENTS, list);
  },

  updatePayment: (updatedPayment: PaymentRecord) => {
    const list = db.getPayments();
    const index = list.findIndex(p => p.id === updatedPayment.id);
    if (index !== -1) {
        list[index] = updatedPayment;
        saveToStorage(KEYS.PAYMENTS, list);
    }
  },

  deletePayment: (id: string) => {
    let list = db.getPayments();
    const payment = list.find(p => p.id === id);
    if (payment) {
        // Get student name for description if possible
        const student = db.getStudents().find(s => s.id === payment.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        
        db.addToTrash({
            id: `T_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'PAYMENT',
            originalId: id,
            data: payment,
            deletedAt: new Date().toISOString(),
            description: `Payment: ₹${payment.amountPaid} for ${studentName}`
        });

        list = list.filter(p => p.id !== id);
        saveToStorage(KEYS.PAYMENTS, list);
    }
  },

  getFees: (): FeeStructure[] => getFromStorage(KEYS.FEES, FEE_STRUCTURES),

  addFeeStructure: (fee: FeeStructure) => {
    const list = db.getFees();
    list.push(fee);
    saveToStorage(KEYS.FEES, list);
  },

  getExpenses: (): Expense[] => getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES),

  addExpense: (expense: Expense) => {
    const list = db.getExpenses();
    list.push(expense);
    saveToStorage(KEYS.EXPENSES, list);
  },

  updateExpense: (updatedExpense: Expense) => {
    const list = db.getExpenses();
    const index = list.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
        list[index] = updatedExpense;
        saveToStorage(KEYS.EXPENSES, list);
    }
  },

  deleteExpense: (id: number | string) => {
    let list = db.getExpenses();
    const expense = list.find(e => e.id === id);
    if (expense) {
        db.addToTrash({
            id: `T_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'EXPENSE',
            originalId: id.toString(),
            data: expense,
            deletedAt: new Date().toISOString(),
            description: `Expense: ${expense.category} - ₹${expense.amount}`
        });

        list = list.filter(e => e.id !== id);
        saveToStorage(KEYS.EXPENSES, list);
    }
  },

  getSchoolProfile: (): SchoolProfile => {
    const stored = getFromStorage(KEYS.SCHOOL_PROFILE, DEFAULT_SCHOOL_PROFILE);
    // Merge with default to ensure new fields (like feesReceiptTerms) exist if storage is from older version
    return { ...DEFAULT_SCHOOL_PROFILE, ...stored };
  },

  updateSchoolProfile: (profile: SchoolProfile) => {
    saveToStorage(KEYS.SCHOOL_PROFILE, profile);
  },

  getClasses: (): string[] => getFromStorage(KEYS.CLASSES, DEFAULT_CLASSES),

  addClass: (className: string) => {
    const list = db.getClasses();
    if (!list.includes(className)) {
        list.push(className);
        list.sort();
        saveToStorage(KEYS.CLASSES, list);
    }
  },

  deleteClass: (className: string) => {
    let list = db.getClasses();
    list = list.filter(c => c !== className);
    saveToStorage(KEYS.CLASSES, list);
  },

  // --- Trash Management ---
  getTrash: (): TrashItem[] => getFromStorage(KEYS.TRASH, []),

  addToTrash: (item: TrashItem) => {
    const list = db.getTrash();
    list.unshift(item); // Add to beginning
    saveToStorage(KEYS.TRASH, list);
  },

  restoreFromTrash: (trashId: string) => {
    const trashList = db.getTrash();
    const itemIndex = trashList.findIndex(i => i.id === trashId);
    
    if (itemIndex !== -1) {
        const item = trashList[itemIndex];
        
        // Restore based on type
        if (item.type === 'STUDENT') {
            db.addStudent(item.data);
        } else if (item.type === 'PAYMENT') {
            db.addPayment(item.data);
        } else if (item.type === 'EXPENSE') {
            db.addExpense(item.data);
        }

        // Remove from trash
        trashList.splice(itemIndex, 1);
        saveToStorage(KEYS.TRASH, trashList);
        return true;
    }
    return false;
  },

  permanentDeleteTrashItem: (trashId: string) => {
    let list = db.getTrash();
    list = list.filter(i => i.id !== trashId);
    saveToStorage(KEYS.TRASH, list);
  }
};
