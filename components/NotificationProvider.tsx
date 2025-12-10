
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'success': 
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400/30 shadow-emerald-500/30 ring-1 ring-emerald-400/50';
      case 'error': 
        return 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400/30 shadow-red-500/30 ring-1 ring-red-400/50';
      case 'warning': 
        return 'bg-gradient-to-r from-amber-500 to-orange-600 border-orange-400/30 shadow-orange-500/30 ring-1 ring-orange-400/50';
      case 'info': 
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400/30 shadow-blue-500/30 ring-1 ring-blue-400/50';
      default: 
        return 'bg-gray-800 border-gray-700';
    }
  };

  const getEmoji = (type: NotificationType) => {
    switch (type) {
      case 'success': return '🎉';
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '📢';
      default: return '🔔';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 pointer-events-none w-full max-w-md px-4">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`
              pointer-events-auto flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-2xl transform transition-all duration-500 ease-out animate-in slide-in-from-top-10 zoom-in-95
              border backdrop-blur-xl min-w-[340px] max-w-sm text-white
              ${getNotificationStyle(notification.type)}
            `}
          >
            <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0 backdrop-blur-sm border border-white/10">
                {getEmoji(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-[10px] uppercase tracking-widest opacity-90 mb-0.5 text-white/90">
                  {notification.type}
                </p>
                <p className="text-sm font-bold leading-snug shadow-sm drop-shadow-md">
                  {notification.message}
                </p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)} 
              className="ml-2 bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors shrink-0 text-white/80 hover:text-white backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
