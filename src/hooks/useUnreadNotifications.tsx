
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .not("type", "eq", "message");

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error loading unread notifications count:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUnreadCount();

    const channel = supabase
      .channel("unread-notifications-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
            // Recalculate everything when a change occurs
            loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadUnreadCount]);

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .not("type", "eq", "message");

      if (error) throw error;
      // Manually set count to 0 for immediate feedback
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return { unreadCount, markAllAsRead, refresh: loadUnreadCount };
};
