import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../App';
import { Heart, Calendar, Users, Award, Bell, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  created_by: string;
  participant_count?: number;
}

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalVolunteers: number;
  myParticipations: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalVolunteers: 0,
    myParticipations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch upcoming events
      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(count)
        `)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3);

      if (events) {
        setUpcomingEvents(events.map(event => ({
          ...event,
          participant_count: event.event_participants?.[0]?.count || 0
        })));
      }

      // Fetch stats
      const [
        { count: totalEvents },
        { count: upcomingEventsCount },
        { count: totalVolunteers },
        { count: myParticipations }
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
        supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('volunteer_id', user.id)
      ]);

      setStats({
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEventsCount || 0,
        totalVolunteers: totalVolunteers || 0,
        myParticipations: myParticipations || 0,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentNotifications = notifications.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] rounded-2xl p-4 sm:p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back!</h1>
            <p className="text-red-100 mt-1 truncate">
              {user?.name || user?.email}
            </p>
            <p className="text-red-100 text-xs sm:text-sm capitalize">
              {user?.role} • SRCS Volunteer System
            </p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm">Total Events</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.totalEvents}</p>
            </div>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#D32F2F] flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm">Volunteers</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.totalVolunteers}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#D32F2F] flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm">Upcoming</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.upcomingEvents}</p>
            </div>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm">My Events</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.myParticipations}</p>
            </div>
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-[#D32F2F] flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {unreadCount > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Bell className="w-5 h-5 mr-2 text-[#D32F2F]" />
              Notifications ({unreadCount})
            </h3>
          </div>
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.read_status 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-[#D32F2F] bg-red-50'
                }`}
                onClick={() => !notification.read_status && markAsRead(notification.id)}
              >
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events</p>
            <p className="text-sm text-gray-400">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <span className="text-xs bg-[#D32F2F] text-white px-2 py-1 rounded">
                    {format(new Date(event.date), 'MMM dd')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>📍 {event.location}</span>
                  <span>{event.participant_count || 0} participants</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}