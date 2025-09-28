import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface BottomNavigationProps {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
}

export default function BottomNavigation({ currentRoute, setCurrentRoute }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      show: true,
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      path: '/events',
      show: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      show: true,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      path: '/admin',
      show: user?.role === 'admin',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setCurrentRoute(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-2 px-2 sm:px-4 max-w-screen-xl mx-auto">
        {navigationItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 relative transition-all duration-200 ${
                  isActive
                    ? 'text-[#D32F2F] scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:scale-105'
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'fill-current' : ''}`} 
                  />
                  {item.id === 'home' && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#D32F2F] text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
                <span className={`text-xs mt-1 truncate max-w-full ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-1 bg-[#D32F2F] rounded-b-full" />
                )}
              </button>
            );
          })}
      </div>
    </nav>
  );
}