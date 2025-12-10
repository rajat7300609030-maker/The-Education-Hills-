
import React, { useState, useEffect } from 'react';
import { UserRole, User, Student, SchoolProfile } from '../types';
import { School, ArrowRight, Shield, Briefcase, GraduationCap, CheckCircle2, User as UserIcon, Calendar, Lock } from 'lucide-react';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [loading, setLoading] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [credentials, setCredentials] = useState({
      userId: '',
      dob: '',
      password: ''
  });

  useEffect(() => {
      setSchoolProfile(db.getSchoolProfile());
  }, []);

  const handleLogin = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        const users = db.getAllUsers();
        let user;

        // If User ID is entered, strict validation applies
        if (credentials.userId.trim()) {
            user = users.find(u => u.id.toLowerCase() === credentials.userId.trim().toLowerCase());
            
            if (!user) {
                alert("Invalid User ID");
                setLoading(false);
                return;
            }

            // Validate role match
            if (user.role !== selectedRole) {
                alert(`User found but role does not match ${selectedRole}`);
                setLoading(false);
                return;
            }

            // CHECK: REQUIRE EITHER DOB OR PASSWORD
            if (!credentials.dob && !credentials.password) {
                alert("Please enter either your Date of Birth OR Password to login.");
                setLoading(false);
                return;
            }

            let isAuthenticated = false;

            // 1. Check Date of Birth
            if (credentials.dob) {
                if (user.role === UserRole.STUDENT) {
                    const studentUser = user as Student;
                    // For students, check if DOB matches record
                    if (studentUser.dob === credentials.dob) {
                        isAuthenticated = true;
                    }
                } else {
                    // For Admin/Employee in mock, accept if DOB is provided (Simulating verification)
                    // In a real app, Admin would also have a DOB field to check against
                    if (credentials.dob) isAuthenticated = true;
                }
            }

            // 2. Check Password (If not already authenticated via DOB)
            if (!isAuthenticated && credentials.password) {
                // Mock password validation: accept any non-empty password
                if (credentials.password.length > 0) {
                    isAuthenticated = true;
                }
            }

            if (!isAuthenticated) {
                alert("Authentication failed. The Date of Birth does not match our records.");
                setLoading(false);
                return;
            }

        } else {
            // Demo Mode: Find first user of selected role if no ID entered
            user = users.find(u => u.role === selectedRole);
        }

        if (user) {
            onLogin(user as User);
        } else {
            alert("No user available for this role.");
        }
        setLoading(false);
    }, 800);
  };

  const roles = [
    { id: UserRole.ADMIN, label: 'Admin', icon: Shield, description: 'Manage School' },
    { id: UserRole.EMPLOYEE, label: 'Staff', icon: Briefcase, description: 'Manage Fees' },
    { id: UserRole.STUDENT, label: 'Student', icon: GraduationCap, description: 'View Records' },
  ];

  // Dynamic Theme Helper based on Role
  const getRoleTheme = (role: UserRole) => {
      switch (role) {
          case UserRole.ADMIN:
              return {
                  activeBorder: 'border-indigo-500 dark:border-indigo-400',
                  activeBg: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900 dark:via-blue-900 dark:to-indigo-950',
                  text: 'text-indigo-700 dark:text-indigo-100',
                  subText: 'text-indigo-600 dark:text-indigo-300',
                  iconBg: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-white',
                  buttonGradient: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
                  shadow: 'shadow-indigo-200 dark:shadow-indigo-900/40',
                  inputFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
                  inputIcon: 'text-indigo-400'
              };
          case UserRole.EMPLOYEE:
              return {
                  activeBorder: 'border-emerald-500 dark:border-emerald-400',
                  activeBg: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900 dark:via-teal-900 dark:to-emerald-950',
                  text: 'text-emerald-700 dark:text-emerald-100',
                  subText: 'text-emerald-600 dark:text-emerald-300',
                  iconBg: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-white',
                  buttonGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
                  shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
                  inputFocus: 'focus:ring-emerald-500 focus:border-emerald-500',
                  inputIcon: 'text-emerald-400'
              };
          case UserRole.STUDENT:
              return {
                  activeBorder: 'border-orange-500 dark:border-orange-400',
                  activeBg: 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900 dark:via-red-900 dark:to-orange-950',
                  text: 'text-orange-700 dark:text-orange-100',
                  subText: 'text-orange-600 dark:text-orange-300',
                  iconBg: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-white',
                  buttonGradient: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500',
                  shadow: 'shadow-orange-200 dark:shadow-orange-900/40',
                  inputFocus: 'focus:ring-orange-500 focus:border-orange-500',
                  inputIcon: 'text-orange-400'
              };
          default:
              return {
                  activeBorder: 'border-gray-500',
                  activeBg: 'bg-gray-100',
                  text: 'text-gray-900',
                  subText: 'text-gray-500',
                  iconBg: 'bg-gray-200',
                  buttonGradient: 'bg-gray-900',
                  shadow: 'shadow-gray-200',
                  inputFocus: 'focus:ring-gray-500',
                  inputIcon: 'text-gray-400'
              };
      }
  };

  const currentTheme = getRoleTheme(selectedRole);

  return (
    <div className="min-h-screen flex bg-white dark:bg-black font-sans transition-colors duration-300">
      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-16 text-white">
         {/* Background Image & Overlay */}
         <div className="absolute inset-0 z-0">
            {schoolProfile?.backgroundImage ? (
                <img 
                    src={schoolProfile.backgroundImage} 
                    alt="Campus" 
                    className="w-full h-full object-cover"
                />
            ) : (
                <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                    alt="University Campus" 
                    className="w-full h-full object-cover"
                />
            )}
            <div className="absolute inset-0 bg-indigo-950/90"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 mix-blend-overlay"></div>
         </div>

         {/* Decorative Abstract Shapes */}
         <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-purple-500 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-blue-500 blur-3xl opacity-50"></div>
         </div>
         
         {/* Content */}
         <div className="relative z-10 animate-in slide-in-from-top-8 duration-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-1">
                    {schoolProfile?.logo ? (
                        <img src={schoolProfile.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <span className="font-bold text-2xl">{schoolProfile?.name.charAt(0) || 'E'}</span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold tracking-wider text-xl leading-tight uppercase">{schoolProfile?.name || 'THE EDUCATION HILLS'}</span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold tracking-widest text-indigo-100 uppercase w-fit">
                        Session: {schoolProfile?.currentSession || '2024-2025'}
                    </span>
                </div>
            </div>
         </div>

         <div className="relative z-10 max-w-lg space-y-6 animate-in slide-in-from-left-8 duration-1000 delay-150">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {schoolProfile?.tagline ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                        "{schoolProfile.tagline}"
                    </span>
                ) : (
                    <>
                        Knowledge is <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Power.</span>
                    </>
                )}
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
                Welcome to the next generation of school management. Streamlined fees, real-time insights, and seamless communication.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-indigo-300 uppercase tracking-widest pt-4">
                <div className="h-0.5 w-12 bg-indigo-500"></div>
                Secure Portal Access
            </div>
         </div>

         <div className="relative z-10 text-indigo-400 text-sm animate-in fade-in duration-1000 delay-300">
            © {new Date().getFullYear()} {schoolProfile?.name || 'The Education Hills'}. All rights reserved.
         </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-white dark:bg-black">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gray-50 dark:bg-black z-0">
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
            <div className="text-center lg:text-left">
                {/* Mobile Branding (Visible only on small screens) */}
                <div className="lg:hidden mb-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden p-1 mb-3">
                        {schoolProfile?.logo ? (
                            <img src={schoolProfile.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <School className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center leading-tight">{schoolProfile?.name || 'Education Hills'}</h2>
                    <span className="mt-1 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase border border-indigo-100 dark:border-indigo-800">
                        Session {schoolProfile?.currentSession}
                    </span>
                </div>

                <div className="lg:hidden w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm hidden">
                    <School className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Select role and enter credentials to continue.</p>
            </div>

            <div className="space-y-6">
                {/* Role Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        const theme = getRoleTheme(role.id);

                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 group cursor-pointer overflow-hidden ${
                                    isSelected 
                                    ? `${theme.activeBorder} ${theme.activeBg} shadow-xl scale-105 ring-1 ring-white/10` 
                                    : 'border-white dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 animate-in fade-in zoom-in">
                                        <CheckCircle2 className={`w-4 h-4 ${theme.text}`} />
                                    </div>
                                )}
                                <div className={`p-2.5 rounded-full mb-2 transition-colors ${
                                    isSelected 
                                    ? theme.iconBg 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                                }`}>
                                     <Icon className="w-5 h-5" />
                                </div>
                                <span className={`font-bold text-xs ${isSelected ? theme.text : 'text-gray-700 dark:text-gray-300'}`}>{role.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Login Inputs */}
                <div className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">User ID</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className={`h-5 w-5 ${currentTheme.inputIcon}`} />
                            </div>
                            <input
                                type="text"
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${currentTheme.inputFocus}`}
                                placeholder="e.g. ST001"
                                value={credentials.userId}
                                onChange={(e) => setCredentials({...credentials, userId: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1 flex justify-between">
                            Date of Birth 
                            <span className="text-[10px] font-normal text-gray-400 lowercase italic tracking-normal">(Fill this OR Password)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className={`h-5 w-5 ${currentTheme.inputIcon}`} />
                            </div>
                            <input
                                type="date"
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${currentTheme.inputFocus}`}
                                value={credentials.dob}
                                onChange={(e) => setCredentials({...credentials, dob: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative flex items-center justify-center my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white dark:bg-gray-900 px-3 text-gray-400 font-bold">OR</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1 flex justify-between">
                            Password
                            <span className="text-[10px] font-normal text-gray-400 lowercase italic tracking-normal">(Fill this OR Date of Birth)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className={`h-5 w-5 ${currentTheme.inputIcon}`} />
                            </div>
                            <input
                                type="password"
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${currentTheme.inputFocus}`}
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`w-full font-bold py-4 rounded-xl transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 text-white ${currentTheme.buttonGradient} ${currentTheme.shadow} hover:-translate-y-0.5`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Verifying...</span>
                        </div>
                    ) : (
                        <>
                            Sign In 
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
                
                <div className="text-center space-y-2">
                     <p className="text-xs text-gray-400 dark:text-gray-500">
                        Protected by {schoolProfile?.name || 'EduHills'} SecureAuth™
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;