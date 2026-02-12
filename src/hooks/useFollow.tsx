import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriendship } from '@/hooks/useFriendship';
import { toast } from '@/hooks/use-toast';

export const useFollow = () => {
  const { user } = useAuth();
  const { checkMutualFollow } = useFriendship();
  const [loading, setLoading] = useState(false);

  const followUser = async (userId: string) => {
    if (!user) return { success: false, error: 'No user found' };

    try {
      setLoading(true);
      
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        return { success: false, error: 'Ya sigues a este usuario' };
      }

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
          status: 'accepted'
        });

      if (error) throw error;

      // Verificar si ahora se siguen mutuamente para crear amistad
      setTimeout(() => {
        checkMutualFollow(userId);
      }, 1000);

      toast({
        title: "¡Éxito!",
        description: "Ahora sigues a este usuario"
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error following user:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return { success: false, error: 'No user found' };

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      toast({
        title: "Dejaste de seguir",
        description: "Ya no sigues a este usuario"
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async (userId: string) => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  return {
    followUser,
    unfollowUser,
    checkIfFollowing,
    loading
  };
};
