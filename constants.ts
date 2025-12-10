
import { UserRole, PaymentStatus, Student, FeeStructure, PaymentRecord, Expense } from './types';

export const FEE_STRUCTURES: FeeStructure[] = [
  { id: 'F_ADM_PG8', name: 'Admission P.G to 8th', amount: 5000, dueDate: '2024-04-15', session: '2024-2025' },
  { id: 'F_REG_910', name: 'Registration 9th & 10th', amount: 2500, dueDate: '2024-04-15', session: '2024-2025' },
  { id: 'F_CLASS', name: 'Class fees', amount: 3000, dueDate: '2024-05-10', session: '2024-2025' },
  { id: 'F_INST', name: 'Instalments', amount: 8000, dueDate: '2024-08-10', session: '2024-2025' },
  { id: 'F_EXAM', name: 'Exam fees', amount: 500, dueDate: '2024-09-01', session: '2024-2025' },
  { id: 'F_BACK', name: 'Back year fees', amount: 0, dueDate: '2024-04-01', session: '2024-2025' },
  { id: 'F_ID', name: 'Id proof fees', amount: 150, dueDate: '2024-04-20', session: '2024-2025' },
  { id: 'F_UNI', name: 'Uniform and book fees', amount: 4500, dueDate: '2024-04-10', session: '2024-2025' },
  { id: 'F_TRANS', name: 'Transport fees', amount: 1200, dueDate: '2024-05-01', session: '2024-2025' },
  { id: 'F_UNK', name: 'Unknown', amount: 0, dueDate: '2024-12-31', session: '2024-2025' },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 'ST001', name: 'Alice Johnson', role: UserRole.STUDENT, grade: '10th', parentName: 'Robert Johnson', contact: '555-0101', feeStructureIds: ['F_REG_910', 'F_CLASS', 'F_EXAM', 'F_ID'], session: '2024-2025' },
  { id: 'ST002', name: 'Bob Smith', role: UserRole.STUDENT, grade: '8th', parentName: 'Sarah Smith', contact: '555-0102', feeStructureIds: ['F_ADM_PG8', 'F_CLASS', 'F_UNI', 'F_TRANS'], session: '2024-2025' },
  { id: 'ST003', name: 'Charlie Brown', role: UserRole.STUDENT, grade: '11th', parentName: 'Lucy Brown', contact: '555-0103', feeStructureIds: ['F_CLASS', 'F_TRANS', 'F_INST'], session: '2024-2025' },
  { id: 'ST004', name: 'Diana Prince', role: UserRole.STUDENT, grade: '12th', parentName: 'Hippolyta', contact: '555-0104', feeStructureIds: ['F_CLASS', 'F_EXAM', 'F_TRANS', 'F_ID'], session: '2024-2025' },
  { id: 'ST005', name: 'Evan Wright', role: UserRole.STUDENT, grade: '9th', parentName: 'John Wright', contact: '555-0105', feeStructureIds: ['F_REG_910', 'F_CLASS'], session: '2024-2025' },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'P001', studentId: 'ST001', feeStructureId: 'F_CLASS', amountPaid: 1500, date: '2024-08-02', method: 'ONLINE', session: '2024-2025' },
  { id: 'P002', studentId: 'ST001', feeStructureId: 'F_ID', amountPaid: 150, date: '2024-08-02', method: 'ONLINE', session: '2024-2025' },
  { id: 'P003', studentId: 'ST002', feeStructureId: 'F_ADM_PG8', amountPaid: 5000, date: '2024-07-28', method: 'CHECK', session: '2024-2025' },
  { id: 'P004', studentId: 'ST003', feeStructureId: 'F_CLASS', amountPaid: 1000, date: '2024-08-05', method: 'CASH', session: '2024-2025' },
  { id: 'P005', studentId: 'ST004', feeStructureId: 'F_CLASS', amountPaid: 3000, date: '2024-08-01', method: 'ONLINE', session: '2024-2025' },
  { id: 'P006', studentId: 'ST004', feeStructureId: 'F_EXAM', amountPaid: 500, date: '2024-09-10', method: 'ONLINE', session: '2024-2025' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 1, category: '💸 Salaries', description: 'Monthly staff salaries', amount: 45000, date: '2024-09-01', session: '2024-2025' },
  { id: 2, category: '💡 Utilities', description: 'Electricity bill for August', amount: 3200, date: '2024-09-05', session: '2024-2025' },
  { id: 3, category: '🔧 Maintenance', description: 'Plumbing repairs in block A', amount: 1500, date: '2024-09-10', session: '2024-2025' },
  { id: 4, category: '📝 Supplies', description: 'Office stationery and markers', amount: 2100, date: '2024-09-12', session: '2024-2025' },
  { id: 5, category: '🎉 Events', description: 'Teachers Day celebration', amount: 5000, date: '2024-09-15', session: '2024-2025' },
];

export const MOCK_USERS = [
  { id: 'ADM001', name: 'Admin Principal', role: UserRole.ADMIN, avatar: 'https://picsum.photos/100/100' },
  { id: 'EMP001', name: 'John Bursar', role: UserRole.EMPLOYEE, avatar: 'https://picsum.photos/101/101' },
  ...MOCK_STUDENTS
];
