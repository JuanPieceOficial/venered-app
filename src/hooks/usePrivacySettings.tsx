
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PrivacySettings {
  id: string;
  user_id: string;
  hide_email: boolean;
  hide_location: boolean;
  hide_website: boolean;
  hide_followers_count: boolean;
  hide_following_count: boolean;
  hide_posts_count: boolean;
  private_posts: boolean;
  allow_message_from_strangers: boolean;
  show_online_status: boolean;
  created_at: string;
  updated_at: string;
}

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default ones
          await createDefaultSettings();
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error loading privacy settings:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones de privacidad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        hide_email: true,
        hide_location: false,
        hide_website: false,
        hide_followers_count: false,
        hide_following_count: false,
        hide_posts_count: false,
        private_posts: false,
        allow_message_from_strangers: true,
        show_online_status: true
      };

      const { data, error } = await supabase
        .from('privacy_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err: any) {
      console.error('Error creating default settings:', err);
      toast({
        title: "Error",
        description: "No se pudieron crear las configuraciones por defecto",
        variant: "destructive"
      });
    }
  };

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    if (!user || !settings) return { success: false, error: 'No hay configuraciones disponibles' };

    try {
      setUpdating(true);
      
      const { data, error } = await supabase
        .from('privacy_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      
      toast({
        title: "Configuraciones actualizadas",
        description: "Tus configuraciones de privacidad se han guardado"
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating privacy settings:', err);
      toast({
        title: "Error",
        description: err.message || "No se pudieron actualizar las configuraciones",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    updating,
    updatePrivacySettings,
    refetch: loadPrivacySettings
  };
};
