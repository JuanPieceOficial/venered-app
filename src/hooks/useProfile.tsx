
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
  created_at: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_private?: boolean;
}

interface PrivacySettings {
  hide_email: boolean;
  hide_location: boolean;
  hide_website: boolean;
  hide_followers_count: boolean;
  hide_following_count: boolean;
  hide_posts_count: boolean;
  private_posts: boolean;
  allow_message_from_strangers: boolean;
  show_online_status: boolean;
}

export const useProfile = (targetUserId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = targetUserId || user?.id;
    if (userId) {
      loadProfile(userId);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, targetUserId]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Check if we're viewing our own profile or someone else's
      const isOwnProfile = user?.id === userId;
      
      if (!isOwnProfile) {
        // Get privacy settings for the target user
        const { data: privacySettings, error: privacyError } = await supabase
          .from('privacy_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (privacyError && privacyError.code !== 'PGRST116') {
          console.error('Error loading privacy settings:', privacyError);
        }

        // Apply privacy settings if they exist
        if (privacySettings) {
          const filteredProfile = { ...profileData };
          
          if (privacySettings.hide_location) {
            filteredProfile.location = undefined;
          }
          
          if (privacySettings.hide_website) {
            filteredProfile.website = undefined;
          }
          
          if (privacySettings.hide_followers_count) {
            filteredProfile.followers_count = 0;
          }
          
          if (privacySettings.hide_following_count) {
            filteredProfile.following_count = 0;
          }
          
          if (privacySettings.hide_posts_count) {
            filteredProfile.posts_count = 0;
          }
          
          setProfile(filteredProfile);
        } else {
          setProfile(profileData);
        }
      } else {
        // Own profile - show everything
        setProfile(profileData);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: 'No user found' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: () => loadProfile(targetUserId || user?.id || ''),
    updateProfile
  };
};
