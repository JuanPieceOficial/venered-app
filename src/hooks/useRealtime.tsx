import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtime = (table: string, callback: () => void) => {
  useEffect(() => {
    const channelName = `table-db-changes-${table}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log('Realtime event received on table:', table, payload);
          
          if (payload.eventType === 'INSERT' && (table === 'notifications' || table === 'messages')) {
            const audio = new Audio('/notification.m4a');
            audio.play().catch(e => console.error('Audio play failed:', e));
          }
          
          callback();
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${table}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
};