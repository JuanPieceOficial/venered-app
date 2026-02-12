
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export const useFriendship = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkFriendship = async (userId: string) => {
    if (!user) return null;

    try {
      // Check if both users follow each other (mutual follow = friendship)
      const { data: mutualFollows, error } = await supabase
        .from('follows')
        .select('*')
        .in('follower_id', [user.id, userId])
        .in('following_id', [user.id, userId])
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Return friendship if both users follow each other
      return mutualFollows && mutualFollows.length === 2 ? { id: 'mutual', status: 'accepted' } : null;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return null;
    }
  };

  const getFriends = async () => {
    if (!user) return [];

    try {
      // Get all users that the current user follows
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:profiles!follows_following_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      if (!following) return [];

      // Get all users that follow the current user back
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .eq('status', 'accepted');

      if (followersError) throw followersError;

      const followerIds = followers?.map(f => f.follower_id) || [];

      // Filter for mutual follows (friends)
      const friends = following
        .filter(follow => followerIds.includes(follow.following_id))
        .map(follow => ({
          friendship: { id: 'mutual', status: 'accepted' },
          friend: follow.profiles as Friend
        }));

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  };

  const checkMutualFollow = async (userId: string) => {
    if (!user) return false;

    try {
      // Check if both users follow each other
      const { data: followData, error } = await supabase
        .from('follows')
        .select('*')
        .in('follower_id', [user.id, userId])
        .in('following_id', [user.id, userId])
        .eq('status', 'accepted');

      if (error) throw error;

      // Must have exactly 2 records for mutual follow
      return followData?.length === 2;
    } catch (error) {
      console.error('Error checking mutual follow:', error);
      return false;
    }
  };

  const createFriendship = async (userId: string) => {
    if (!user) return { success: false, error: 'No user found' };

    try {
      setLoading(true);
      console.log('Friendship automatically created through mutual follows');
      return { success: true };
    } catch (err: any) {
      console.error('Error creating friendship:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkFriendship,
    getFriends,
    checkMutualFollow,
    createFriendship,
    loading
  };
};
