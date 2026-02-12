
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtime = (table: string, callback: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
};
