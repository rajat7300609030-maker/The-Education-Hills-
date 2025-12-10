

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  STUDENT = 'STUDENT'
}

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STUDENT_MANAGER = 'STUDENT_MANAGER',
  STUDENT_PROFILE = 'STUDENT_PROFILE',
  PARENT_PROFILE = 'PARENT_PROFILE',
  FEES_MANAGER = 'FEES_MANAGER',
  EXPENSES = 'EXPENSES',
  SCHOOL_PROFILE = 'SCHOOL_PROFILE',
  SETTINGS = 'SETTINGS',
  RECYCLE_BIN = 'RECYCLE_BIN',
  USER_PROFILE = 'USER_PROFILE'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  bio?: string;
  dob?: string;
}

export interface FeeStructure {
  id: string;
  name: string; // e.g., "Annual Tuition 2024"
  amount: number;
  dueDate: string;
  session: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  date: string;
  method: string;
  session: string;
}

export interface Student extends User {
  grade: string;
  parentName: string;
  contact: string;
  feeStructureIds: string[]; // Fees assigned to this student
  session: string;
  address?: string;
  totalClassFees?: number;
  backFees?: number;
  admissionDate?: string;
}

export interface Expense {
  id: number | string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  session: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCollected: number;
  totalPending: number;
  monthlyCollection: { name: string; amount: number }[];
}

export interface SliderImage {
  id: string;
  url: string;
  title: string;
  subtitle: string;
}

export interface SchoolProfile {
  name: string;
  tagline: string;
  address: string;
  website: string;
  phone: string;
  sessions: string[];
  currentSession: string;
  logo?: string;
  backgroundImage?: string;
  affiliation?: string;
  institutionType?: string;
  feesReceiptTerms?: string;
  sliderImages?: SliderImage[];
}

export interface TrashItem {
  id: string;
  type: 'STUDENT' | 'PAYMENT' | 'EXPENSE';
  originalId: string;
  data: any;
  deletedAt: string;
  description: string;
}