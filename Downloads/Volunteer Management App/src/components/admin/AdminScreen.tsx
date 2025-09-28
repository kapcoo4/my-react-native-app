import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../App';
import { 
  Users, Calendar, Award, TrendingUp, UserCheck, 
  Clock, MapPin, Download, Filter, BarChart3 
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminStats {
  totalVolunteers: number;
  totalEvents: number;
  totalParticipations: number;
  activeVolunteers: number;
}

interface EventReport {
  id: string;
  title: string;
  date: string;
  location: string;
  participant_count: number;
  attended_count: number;
}

interface VolunteerReport {
  id: string;
  name: string;
  email: string;
  total_events: number;
  total_hours: number;
  last_activity: string;
}

export default function AdminScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalVolunteers: 0,
    totalEvents: 0,
    totalParticipations: 0,
    activeVolunteers: 0,
  });
  const [eventReports, setEventReports] = useState<EventReport[]>([]);
  const [volunteerReports, setVolunteerReports] = useState<VolunteerReport[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'volunteers'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchEventReports(),
        fetchVolunteerReports(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [
        { count: totalVolunteers },
        { count: totalEvents },
        { count: totalParticipations },
        { data: activeVolunteersData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('event_participants').select('*', { count: 'exact', head: true }),
        supabase
          .from('event_participants')
          .select('volunteer_id')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const uniqueActiveVolunteers = new Set(activeVolunteersData?.map(p => p.volunteer_id)).size;

      setStats({
        totalVolunteers: totalVolunteers || 0,
        totalEvents: totalEvents || 0,
        totalParticipations: totalParticipations || 0,
        activeVolunteers: uniqueActiveVolunteers,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEventReports = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          date,
          location,
          event_participants(volunteer_id, status)
        `)
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching event reports:', error);
        return;
      }

      const reports = data?.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        participant_count: event.event_participants?.length || 0,
        attended_count: event.event_participants?.filter(p => p.status === 'attended').length || 0,
      })) || [];

      setEventReports(reports);
    } catch (error) {
      console.error('Error in fetchEventReports:', error);
    }
  };

  const fetchVolunteerReports = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          event_participants(
            id,
            hours,
            created_at
          )
        `)
        .eq('role', 'volunteer')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching volunteer reports:', error);
        return;
      }

      const reports = data?.map(volunteer => {
        const participations = volunteer.event_participants || [];
        const totalHours = participations.reduce((sum, p) => sum + (p.hours || 0), 0);
        const lastActivity = participations.length > 0 
          ? Math.max(...participations.map(p => new Date(p.created_at).getTime()))
          : 0;

        return {
          id: volunteer.id,
          name: volunteer.name || volunteer.email,
          email: volunteer.email,
          total_events: participations.length,
          total_hours: totalHours,
          last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : '',
        };
      }) || [];

      setVolunteerReports(reports);
    } catch (error) {
      console.error('Error in fetchVolunteerReports:', error);
    }
  };

  const exportData = (type: 'events' | 'volunteers') => {
    const data = type === 'events' ? eventReports : volunteerReports;
    const headers = type === 'events' 
      ? ['Title', 'Date', 'Location', 'Participants', 'Attended']
      : ['Name', 'Email', 'Total Events', 'Total Hours', 'Last Activity'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (type === 'events') {
          const event = item as EventReport;
          return [
            `"${event.title}"`,
            format(new Date(event.date), 'yyyy-MM-dd'),
            `"${event.location}"`,
            event.participant_count,
            event.attended_count
          ].join(',');
        } else {
          const volunteer = item as VolunteerReport;
          return [
            `"${volunteer.name}"`,
            `"${volunteer.email}"`,
            volunteer.total_events,
            volunteer.total_hours,
            volunteer.last_activity ? format(new Date(volunteer.last_activity), 'yyyy-MM-dd') : 'Never'
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this section.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage volunteers and track activities</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'events', label: 'Events', icon: Calendar },
          { key: 'volunteers', label: 'Volunteers', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 ${
                activeTab === tab.key
                  ? 'bg-white text-[#D32F2F] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
                </div>
                <Users className="w-8 h-8 text-[#D32F2F]" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-[#D32F2F]" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Participations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalParticipations}</p>
                </div>
                <Award className="w-8 h-8 text-[#D32F2F]" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeVolunteers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Recent Events Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Events Performance</h3>
            <div className="space-y-3">
              {eventReports.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.date), 'MMM dd, yyyy')} • {event.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {event.attended_count}/{event.participant_count} attended
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.participant_count > 0 
                        ? Math.round((event.attended_count / event.participant_count) * 100)
                        : 0}% attendance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Reports</h3>
            <button
              onClick={() => exportData('events')}
              className="flex items-center space-x-2 bg-[#D32F2F] text-white px-4 py-2 rounded-lg hover:bg-[#B71C1C] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventReports.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.attended_count}/{event.participant_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.participant_count === 0 
                            ? 'bg-gray-100 text-gray-500'
                            : (event.attended_count / event.participant_count) >= 0.7
                              ? 'bg-green-100 text-green-800'
                              : (event.attended_count / event.participant_count) >= 0.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                          {event.participant_count > 0 
                            ? Math.round((event.attended_count / event.participant_count) * 100)
                            : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'volunteers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Volunteer Reports</h3>
            <button
              onClick={() => exportData('volunteers')}
              className="flex items-center space-x-2 bg-[#D32F2F] text-white px-4 py-2 rounded-lg hover:bg-[#B71C1C] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volunteer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {volunteerReports.map((volunteer) => (
                    <tr key={volunteer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volunteer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volunteer.total_events}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volunteer.total_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volunteer.last_activity 
                          ? format(new Date(volunteer.last_activity), 'MMM dd, yyyy')
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}