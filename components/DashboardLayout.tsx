
import React, { ReactNode, useEffect, useState } from 'react';
import { User, UserRole, AppView, SchoolProfile } from '../types';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Bell,
  LogOut
} from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { db } from '../services/db';

interface Props {
  user: User;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
  children: ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ user, currentView, onViewChange, onLogout, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(() => {
      // Initialize synchronously to prevent flash of empty content
      return db.getSchoolProfile();
  });
  
  const { notifications } = useNotification();
  
  useEffect(() => {
      const fetchProfile = () => setSchoolProfile(db.getSchoolProfile());
      
      // Listen for updates from SchoolProfileView
      window.addEventListener('schoolProfileUpdated', fetchProfile);
      return () => window.removeEventListener('schoolProfileUpdated', fetchProfile);
  }, []);

  // Check if there are active notifications to apply blur effect
  const hasActiveNotifications = notifications.length > 0;

  // Helper to get the active styling for the selected nav item based on the current view
  const getActiveNavGradient = (view: AppView) => {
    switch (view) {
      case AppView.DASHBOARD: return 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-500/30';
      case AppView.STUDENT_MANAGER: return 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-purple-500/30';
      case AppView.FEES_MANAGER: return 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30';
      case AppView.EXPENSES: return 'bg-gradient-to-r from-rose-600 to-red-600 shadow-red-500/30';
      case AppView.SCHOOL_PROFILE: return 'bg-gradient-to-r from-slate-600 to-gray-600 shadow-gray-500/30';
      case AppView.SETTINGS: return 'bg-gradient-to-r from-gray-700 to-slate-800 shadow-gray-500/30';
      case AppView.RECYCLE_BIN: return 'bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-500/30';
      case AppView.USER_PROFILE: return 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30';
      default: return 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-500/30';
    }
  };

  const navItemClass = (active: boolean, activeClass: string) => `
    group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ease-in-out cursor-pointer select-none
    ${active 
      ? `${activeClass} text-white shadow-lg` 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
    }
  `;

  // Define menu items with colorful Emojis - No separate Icon property
  const menuItems = [
    { id: AppView.DASHBOARD, label: '📊 Dashboard' },
    { id: AppView.STUDENT_MANAGER, label: '👨‍🎓 Student Manager' },
    { id: AppView.FEES_MANAGER, label: '💰 Fees Manager' },
    { id: AppView.EXPENSES, label: '💸 Expenses' },
    { id: AppView.SCHOOL_PROFILE, label: '🏫 School Profile' },
    { id: AppView.SETTINGS, label: '⚙️ Settings' },
    { id: AppView.RECYCLE_BIN, label: '🗑️ Recycle Bin' },
  ];

  // Filter menu items based on role (Student gets limited view)
  const visibleMenuItems = user.role === UserRole.STUDENT 
    ? [menuItems[0], menuItems[4], menuItems[5]] // Dashboard, Profile, Settings
    : menuItems;

  const currentMenuLabel = menuItems.find(i => i.id === currentView)?.label || 
                           (currentView === AppView.USER_PROFILE ? '👤 User Profile' : '📊 Dashboard');

  const getHeaderGradient = (view: AppView) => {
    switch (view) {
      case AppView.DASHBOARD: return 'from-indigo-900 via-blue-900 to-indigo-950';
      case AppView.STUDENT_MANAGER: return 'from-violet-900 via-purple-900 to-fuchsia-900';
      case AppView.FEES_MANAGER: return 'from-emerald-900 via-teal-900 to-cyan-900';
      case AppView.EXPENSES: return 'from-rose-900 via-red-900 to-pink-900';
      case AppView.SCHOOL_PROFILE: return 'from-slate-800 via-gray-800 to-zinc-900';
      case AppView.SETTINGS: return 'from-gray-900 via-slate-900 to-black';
      case AppView.RECYCLE_BIN: return 'from-orange-900 via-amber-900 to-red-900';
      case AppView.USER_PROFILE: return 'from-indigo-900 via-purple-900 to-blue-900';
      default: return 'from-indigo-900 to-blue-900';
    }
  };

  const getPageBackgroundGradient = (view: AppView) => {
    switch (view) {
      case AppView.DASHBOARD: return 'bg-gradient-to-br from-indigo-100 via-white to-blue-50 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.STUDENT_MANAGER: return 'bg-gradient-to-br from-violet-100 via-white to-purple-50 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.FEES_MANAGER: return 'bg-gradient-to-br from-emerald-100 via-white to-teal-50 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.EXPENSES: return 'bg-gradient-to-br from-rose-100 via-white to-red-50 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.SCHOOL_PROFILE: return 'bg-gradient-to-br from-slate-200 via-white to-gray-100 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.SETTINGS: return 'bg-gradient-to-br from-gray-200 via-white to-slate-100 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.RECYCLE_BIN: return 'bg-gradient-to-br from-orange-100 via-white to-amber-50 dark:from-black dark:via-black dark:to-gray-900';
      case AppView.USER_PROFILE: return 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-black dark:via-black dark:to-gray-900';
      default: return 'bg-gradient-to-br from-indigo-100 via-white to-blue-50 dark:from-black dark:via-black dark:to-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 
        bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800
        text-gray-900 dark:text-white
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="h-full flex flex-col relative overflow-hidden">
            
            {/* School Profile Header Section in Sidebar */}
            <div className="relative h-36 flex flex-col justify-end px-6 pb-4 border-b border-gray-100 dark:border-gray-800 overflow-hidden group shrink-0">
                {/* Background Image */}
                {schoolProfile?.backgroundImage ? (
                    <>
                        <div className="absolute inset-0 z-0">
                            <img 
                                src={schoolProfile.backgroundImage} 
                                alt="School Bg" 
                                className="w-full h-full object-cover opacity-60 dark:opacity-40 blur-[2px] scale-110 group-hover:scale-125 transition-transform duration-700" 
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent z-0"></div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-black z-0"></div>
                )}

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
                        {schoolProfile?.logo ? (
                            <img src={schoolProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{schoolProfile?.name?.charAt(0) || 'E'}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold tracking-tight leading-tight text-gray-900 dark:text-white truncate" title={schoolProfile?.name}>
                            {schoolProfile?.name || 'EduHills'}
                        </span>
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                            {schoolProfile?.tagline || 'Knowledge Is Power'}
                        </span>
                        <span className="inline-block mt-1 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-semibold">
                            Session: {schoolProfile?.currentSession || '2024-2025'}
                        </span>
                    </div>
                </div>
            </div>
            
            <nav className="relative z-10 flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</div>
                
                {visibleMenuItems.map((item) => {
                    const isActive = currentView === item.id;
                    const activeClass = getActiveNavGradient(item.id);
                    
                    return (
                        <div 
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                setMobileMenuOpen(false);
                            }} 
                            className={navItemClass(isActive, activeClass)}
                        >
                            <div className="flex items-center gap-3">
                                {/* Removed Lucide Icon */}
                                <span className="font-medium text-lg">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                        </div>
                    );
                })}
            </nav>

            <div className="relative z-10 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <div 
                    className="flex items-center gap-3 mb-4 px-2 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800 rounded-lg p-2 transition-all -mx-2"
                    onClick={() => {
                        onViewChange(AppView.USER_PROFILE);
                        setMobileMenuOpen(false);
                    }}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-700 overflow-hidden shrink-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                            <span className="capitalize font-medium">{user.role.toLowerCase()}</span>
                            <span className="opacity-50">|</span>
                            <span className="font-mono opacity-80">{user.id}</span>
                        </div>
                    </div>
                </div>
                
                {/* Logout Button */}
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-200 dark:shadow-none border border-transparent"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
            
            {/* Mobile close button */}
            <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 md:hidden"
            >
                <X className="w-6 h-6" />
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 md:ml-72 flex flex-col min-w-0 transition-all duration-500 ${getPageBackgroundGradient(currentView)}`}>
        <header 
            className={`
                bg-gradient-to-r ${getHeaderGradient(currentView)} 
                h-16 flex items-center justify-between px-4 sticky top-0 z-30 
                transition-all duration-300 shadow-md
                ${hasActiveNotifications ? 'blur-[3px] opacity-70 grayscale-[30%]' : ''}
            `}
        >
            {/* Background Texture/Shine for Header */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>

            <div className="relative z-10 flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-lg md:hidden transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
                
                 {/* Page Title with Emoji - Visible on mobile and desktop */}
                 <h2 className="flex items-center gap-2 text-xl font-bold text-white shadow-black/10 drop-shadow-md">
                   {currentMenuLabel}
                </h2>
            </div>

            {/* Header Right Side: Notification & User Greeting */}
            <div className="relative z-10 flex items-center gap-2">
                <button className="relative p-2 text-white/80 hover:bg-white/10 hover:text-white rounded-full transition-colors group">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-transparent animate-pulse"></span>
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2 hidden md:block"></div>
                
                <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">Hi, {user.name.split(' ')[0]} 👋</span>
                </div>
            </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            <div 
                key={currentView}
                className="max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out"
            >
                {children}
            </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;