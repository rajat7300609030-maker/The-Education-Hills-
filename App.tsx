
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboard from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentManager from './components/StudentManager';
import StudentProfileView from './components/StudentProfileView';
import ParentProfileView from './components/ParentProfileView';
import UserProfileView from './components/UserProfileView';
import Login from './components/Login';
import { ExpensesView, SchoolProfileView, SettingsView, RecycleBinView } from './components/SecondaryViews';
import { User, UserRole, AppView } from './types';
import { db } from './services/db';
import { NotificationProvider } from './components/NotificationProvider';

// Default Admin User for auto-login (Kept for reference, but not used for init)
const DEFAULT_USER: User = { 
  id: 'ADM001', 
  name: 'Admin Principal', 
  role: UserRole.ADMIN, 
  avatar: 'https://picsum.photos/100/100' 
};

const App: React.FC = () => {
  // Initialize with null to force Login page
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    db.init();
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleUpdateUser = (updatedUser: User) => {
      db.updateUser(updatedUser); // Persist to database/storage
      setUser(updatedUser);       // Update application state
  };

  const handleNavigateToStudentProfile = (studentId: string) => {
      setSelectedStudentId(studentId);
      setCurrentView(AppView.STUDENT_PROFILE);
  };

  const handleNavigateToParentProfile = (studentId: string) => {
      setSelectedStudentId(studentId);
      setCurrentView(AppView.PARENT_PROFILE);
  };

  const handleNavigateToFees = (studentId: string) => {
      setSelectedStudentId(studentId);
      setCurrentView(AppView.FEES_MANAGER);
  };

  const handleBackToManager = () => {
      setSelectedStudentId(null);
      setCurrentView(AppView.STUDENT_MANAGER);
  };

  const handleLogout = () => {
      setUser(null);
      setCurrentView(AppView.DASHBOARD);
  };

  // Render Login if no user is authenticated
  if (!user) {
      return <Login onLogin={setUser} />;
  }

  // Logic to render the specific view content inside the dashboard layout
  const renderContent = () => {
    // Common view for all roles if accessed via menu
    if (currentView === AppView.USER_PROFILE) {
        return <UserProfileView user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
    }

    // For Students, we typically just show their specific Dashboard (which is a self-contained view)
    // regardless of the nav state, as we limited their nav items to Dashboard/Profile in the layout.
    if (user.role === UserRole.STUDENT) {
       if (currentView === AppView.SCHOOL_PROFILE) return <SchoolProfileView onNavigateToDashboard={() => setCurrentView(AppView.DASHBOARD)} userRole={user.role} />;
       if (currentView === AppView.SETTINGS) return <SettingsView darkMode={darkMode} toggleDarkMode={toggleDarkMode} userRole={user.role} />;
       return <StudentDashboard user={user} />;
    }

    // For Admin and Employee
    switch (currentView) {
      case AppView.DASHBOARD:
        return <AdminDashboard onNavigate={setCurrentView} />;
      
      case AppView.FEES_MANAGER:
        return <EmployeeDashboard initialStudentId={selectedStudentId} userRole={user.role} />;
      
      case AppView.STUDENT_MANAGER:
        return <StudentManager 
            onNavigateToProfile={handleNavigateToStudentProfile} 
            onNavigateToParentProfile={handleNavigateToParentProfile}
            onNavigateToFees={handleNavigateToFees}
            userRole={user.role}
        />;

      case AppView.STUDENT_PROFILE:
        return <StudentProfileView 
            studentId={selectedStudentId} 
            onBack={handleBackToManager} 
            userRole={user.role} 
            onNavigateToParentProfile={handleNavigateToParentProfile}
        />;

      case AppView.PARENT_PROFILE:
        return <ParentProfileView 
            studentId={selectedStudentId} 
            onBack={handleBackToManager}
            onNavigateToFees={handleNavigateToFees}
            userRole={user.role}
        />;

      case AppView.EXPENSES:
        return <ExpensesView userRole={user.role} />;

      case AppView.SCHOOL_PROFILE:
        return <SchoolProfileView onNavigateToDashboard={() => setCurrentView(AppView.DASHBOARD)} userRole={user.role} />;

      case AppView.SETTINGS:
        return <SettingsView darkMode={darkMode} toggleDarkMode={toggleDarkMode} userRole={user.role} />;
      
      case AppView.RECYCLE_BIN:
        return <RecycleBinView userRole={user.role} />;

      default:
        return <AdminDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardLayout 
                user={user} 
                currentView={currentView}
                onViewChange={setCurrentView}
                onLogout={handleLogout}
              >
                {renderContent()}
              </DashboardLayout>
            } 
          />
        </Routes>
      </NotificationProvider>
    </Router>
  );
};

export default App;
