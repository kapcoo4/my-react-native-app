import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../App';
import { Calendar, MapPin, Users, Clock, Plus, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner@2.0.3';
import CreateEventModal from './CreateEventModal';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  created_by: string;
  created_by_name?: string;
  participant_count?: number;
  is_joined?: boolean;
}

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'joined'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [user, filter]);

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          users:created_by(name),
          event_participants!left(volunteer_id, status)
        `);

      // Apply filters
      if (filter === 'upcoming') {
        query = query.gte('date', new Date().toISOString());
      } else if (filter === 'joined') {
        query = query
          .eq('event_participants.volunteer_id', user.id)
          .eq('event_participants.status', 'joined');
      }

      query = query.order('date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
        return;
      }

      const processedEvents = data?.map(event => ({
        ...event,
        created_by_name: event.users?.name || 'Unknown',
        participant_count: event.event_participants?.length || 0,
        is_joined: event.event_participants?.some(
          (p: any) => p.volunteer_id === user.id && p.status === 'joined'
        ) || false
      })) || [];

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: eventId,
            volunteer_id: user.id,
            status: 'joined',
          }
        ]);

      if (error) {
        console.error('Error joining event:', error);
        toast.error('Failed to join event');
        return;
      }

      toast.success('Successfully joined the event!');
      fetchEvents(); // Refresh events list
    } catch (error) {
      console.error('Error in handleJoinEvent:', error);
      toast.error('Failed to join event');
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('volunteer_id', user.id);

      if (error) {
        console.error('Error leaving event:', error);
        toast.error('Failed to leave event');
        return;
      }

      toast.success('Successfully left the event');
      fetchEvents(); // Refresh events list
    } catch (error) {
      console.error('Error in handleLeaveEvent:', error);
      toast.error('Failed to leave event');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filterButtons = [
    { key: 'upcoming', label: 'Upcoming', icon: Calendar },
    { key: 'all', label: 'All Events', icon: Filter },
    { key: 'joined', label: 'My Events', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm sm:text-base text-gray-600">Volunteer opportunities</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#D32F2F] text-white p-2 sm:p-3 rounded-full shadow-lg hover:bg-[#B71C1C] transition-colors flex-shrink-0 ml-4"
            aria-label="Create new event"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {filterButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                filter === btn.key
                  ? 'bg-[#D32F2F] text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : filter === 'joined' 
                ? "You haven't joined any events yet"
                : 'No events match your current filter'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {format(new Date(event.date), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <p className="text-gray-600 mb-3">{event.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  {format(new Date(event.date), 'EEEE, MMMM dd, yyyy \'at\' HH:mm')}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-2" />
                  {event.participant_count} participants
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Created by {event.created_by_name}
                </span>
                
                {event.is_joined ? (
                  <button
                    onClick={() => handleLeaveEvent(event.id)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Leave Event
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinEvent(event.id)}
                    className="bg-[#D32F2F] text-white px-4 py-2 rounded-lg hover:bg-[#B71C1C] transition-colors"
                  >
                    Join Event
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}