import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../App';
import { User, Mail, Phone, MapPin, Award, Edit3, Save, X, LogOut } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VolunteerProfile {
  id?: string;
  user_id: string;
  name: string;
  phone: string;
  location: string;
  skills: string;
  bio?: string;
}

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    skills: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || user.name || '',
          phone: data.phone || '',
          location: data.location || '',
          skills: data.skills || '',
          bio: data.bio || '',
        });
      } else {
        // Create initial profile if it doesn't exist
        setFormData({
          name: user.name || '',
          phone: '',
          location: '',
          skills: '',
          bio: '',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const profileData = {
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        skills: formData.skills,
        bio: formData.bio,
      };

      let error;

      if (profile?.id) {
        // Update existing profile
        const result = await supabase
          .from('volunteers')
          .update(profileData)
          .eq('id', profile.id);
        error = result.error;
      } else {
        // Create new profile
        const result = await supabase
          .from('volunteers')
          .insert([profileData]);
        error = result.error;
      }

      if (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile');
        return;
      }

      // Update user name if changed
      if (formData.name !== user.name) {
        await updateProfile({ name: formData.name });
      }

      setProfile(prev => ({ ...prev, ...profileData }));
      setEditMode(false);
      toast.success('Profile updated successfully!');
      
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your volunteer information</p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 ml-4"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">{formData.name || user?.name || 'Volunteer'}</h2>
                <p className="text-red-100 capitalize text-sm sm:text-base">{user?.role}</p>
                <div className="flex items-center mt-1 text-red-100 text-xs sm:text-sm">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors flex-shrink-0 ml-3"
              aria-label={editMode ? 'Cancel editing' : 'Edit profile'}
            >
              {editMode ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          {editMode ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Expertise
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
                  placeholder="e.g., First Aid, Teaching, Translation, Medical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent outline-none"
                  placeholder="Tell us about yourself and your motivation to volunteer"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#D32F2F] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#B71C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6">
              {formData.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[#D32F2F]" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{formData.phone}</p>
                  </div>
                </div>
              )}

              {formData.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-[#D32F2F]" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{formData.location}</p>
                  </div>
                </div>
              )}

              {formData.skills && (
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-[#D32F2F] mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Skills & Expertise</p>
                    <p className="text-gray-900">{formData.skills}</p>
                  </div>
                </div>
              )}

              {formData.bio && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">About Me</p>
                  <p className="text-gray-900 leading-relaxed">{formData.bio}</p>
                </div>
              )}

              {!formData.phone && !formData.location && !formData.skills && !formData.bio && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Complete your profile</p>
                  <p className="text-sm text-gray-400">
                    Add your contact information and skills to help organizers connect with you
                  </p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-4 text-[#D32F2F] hover:text-[#B71C1C] font-semibold"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}