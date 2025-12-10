
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
    Camera, User as UserIcon, Mail, Phone, MapPin, Save, Lock, Shield, 
    Bell, Activity, LogOut, CheckCircle, Smartphone, Globe, Key, Calendar,
    Edit, X
} from 'lucide-react';
import { useNotification } from './NotificationProvider';

interface UserProfileViewProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onLogout?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email || 'admin@educationhills.edu',
        phone: user.phone || '+91 98765 43210',
        bio: user.bio || 'Administrator at The Education Hills. Committed to excellence in education management.',
        avatar: user.avatar,
        dob: user.dob || ''
    });

    // Sync form data if user prop changes (e.g. after save or external update)
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: user.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            bio: user.bio || prev.bio,
            avatar: user.avatar,
            dob: user.dob || prev.dob
        }));
    }, [user]);

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newAvatar = reader.result as string;
                setFormData(prev => ({ ...prev, avatar: newAvatar }));
                onUpdateUser({ ...user, avatar: newAvatar });
                showNotification("Profile picture updated", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({
            ...user,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            bio: formData.bio,
            dob: formData.dob
        });
        showNotification("Profile details saved successfully", "success");
        setIsEditing(false);
    };

    const handlePasswordSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            showNotification("New passwords do not match", "error");
            return;
        }
        if (passwordForm.new.length < 6) {
            showNotification("Password must be at least 6 characters", "warning");
            return;
        }
        // Simulate API call
        setPasswordForm({ current: '', new: '', confirm: '' });
        showNotification("Password updated successfully", "success");
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header Banner */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    {isEditing && (
                        <div className="absolute bottom-4 right-6 flex gap-3 animate-in fade-in">
                            <button className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold hover:bg-white/30 transition-colors flex items-center gap-2">
                                <Camera className="w-4 h-4" /> 📷 Change Cover
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start -mt-16">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                                <div className="w-full h-full bg-indigo-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-indigo-300">{formData.name.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                            
                            {isEditing && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 animate-in zoom-in"
                                    title="Upload Photo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                            />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 pt-16 md:pt-18">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {formData.name}
                                        <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg uppercase tracking-wider font-bold border border-indigo-200 dark:border-indigo-800">
                                            {user.role}
                                        </span>
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {formData.email}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Knowledge City, Campus A</span>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg ${isEditing ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}
                                    >
                                        {isEditing ? <X className="w-4 h-4"/> : <Edit className="w-4 h-4"/>} 
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                    
                                    {!isEditing && (
                                        <button 
                                            onClick={onLogout}
                                            className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
                                        >
                                            <LogOut className="w-4 h-4" /> 👋 Sign Out
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-t border-gray-100 dark:border-gray-700 overflow-x-auto">
                    {[
                        { id: 'profile', icon: UserIcon, label: '👤 Personal Details' },
                        { id: 'security', icon: Shield, label: '🛡️ Login & Security' },
                        { id: 'activity', icon: Activity, label: '⚡ Recent Activity' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Content based on Tab */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-indigo-500" /> 📝 Basic Information
                                </h3>
                                {!isEditing && <span className="text-xs text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Read Only</span>}
                            </div>
                            <form onSubmit={handleProfileSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">📛 Full Name</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 disabled:cursor-default disabled:bg-gray-50/50"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">👑 Role / Designation</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                disabled
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                value={user.role}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">🆔 User ID</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                disabled
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                value={user.id}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">🎂 Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="date" 
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 disabled:cursor-default"
                                                value={formData.dob}
                                                onChange={e => setFormData({...formData, dob: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">📧 Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="email" 
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 disabled:cursor-default"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">📞 Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="tel" 
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 disabled:cursor-default"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">💬 Bio / About</label>
                                    <textarea 
                                        rows={4}
                                        disabled={!isEditing}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none disabled:opacity-70 disabled:cursor-default"
                                        value={formData.bio}
                                        onChange={e => setFormData({...formData, bio: e.target.value})}
                                    />
                                </div>
                                {isEditing && (
                                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in">
                                        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> 💾 Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-indigo-500" /> 🔐 Change Password
                                </h3>
                            </div>
                            <form onSubmit={handlePasswordSave} className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">🔑 Current Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="password" 
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={passwordForm.current}
                                            onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">🔒 New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="password" 
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={passwordForm.new}
                                            onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">✅ Confirm New Password</label>
                                    <div className="relative">
                                        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="password" 
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={passwordForm.confirm}
                                            onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition-all flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> 🔄 Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-500" /> 📜 Recent Activity Log
                                </h3>
                            </div>
                            <div className="space-y-6 relative before:absolute before:left-2.5 before:top-0 before:h-full before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
                                {[
                                    { action: 'Updated profile picture', time: 'Just now', icon: Camera, color: 'bg-blue-500' },
                                    { action: 'Logged in from Chrome on Windows', time: '2 hours ago', icon: Globe, color: 'bg-green-500' },
                                    { action: 'Recorded fee payment for Student #S101', time: 'Yesterday at 4:30 PM', icon: Save, color: 'bg-purple-500' },
                                    { action: 'Updated School Profile details', time: '2 days ago', icon:  Shield, color: 'bg-orange-500' },
                                    { action: 'Password changed successfully', time: '1 week ago', icon: Lock, color: 'bg-red-500' },
                                ].map((item, idx) => (
                                    <div key={idx} className="relative pl-10">
                                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${item.color}`}></div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{item.action}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Preferences Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Notification Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-indigo-500" /> ⚙️ Preferences
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📨 Email Notifications</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🔔 Push Alerts</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📊 Monthly Reports</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Devices */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-indigo-500" /> 🟢 Active Sessions
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">🌍 Windows PC - Chrome</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Knowledge City • Active now</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-60">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">📱 iPhone 13 - Safari</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">2 days ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileView;
