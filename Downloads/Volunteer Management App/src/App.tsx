import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginScreen from './components/auth/LoginScreen';
import RegisterScreen from './components/auth/RegisterScreen';
import Dashboard from './components/dashboard/Dashboard';
import EventsScreen from './components/events/EventsScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import AdminScreen from './components/admin/AdminScreen';
import BottomNavigation from './components/navigation/BottomNavigation';
import { Toaster } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from './utils/supabase/info';

// Initialize Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`;
export const supabase = createClient(supabaseUrl, publicAnonKey);

function AppContent() {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('/');
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database and demo users on app start
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-7361e377/init`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('Database and demo users initialized successfully');
        } else {
          console.warn('Database initialization may have failed');
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      } finally {
        setDbInitialized(true);
      }
    };

    initializeDatabase();
  }, []);

  if (loading || !dbInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!dbInitialized ? 'Initializing database...' : 'Loading...'}
          </p>
          {!dbInitialized && (
            <p className="text-gray-400 text-sm mt-2">
              Setting up demo accounts and database
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="*" element={<LoginScreen />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/admin" element={<AdminScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNavigation currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#D32F2F',
              color: 'white',
            },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;