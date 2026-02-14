
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_user_id?: string | null;
  related_post_id?: string | null;
  related_user?: {
    username: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  related_post?: {
    id: string;
    content?: string | null;
    image_urls?: string[] | null;
  } | null;
}

const Notifications = () => {
  const { user, signOut } = useAuth();
  const { unreadCount, markAllAsRead, refresh: refreshCount } = useUnreadNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `*, related_user:profiles!notifications_related_user_id_fkey(username, full_name, avatar_url), related_post:posts!notifications_related_post_id_fkey(id, content, image_urls)`
        )
        .eq("user_id", user.id)
        .not("type", "eq", "message") // Exclude messages
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel(`notifications-list:${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
            loadNotifications(); // Reload the list on any change
            refreshCount(); // Also refresh the unread count
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications, refreshCount]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      // Optimistic update in UI
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      refreshCount(); // Refresh count after marking one as read
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Optimistically update all visible notifications
    setNotifications(prev => prev.map(n => ({...n, read: true})))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-5 h-5 text-pink-400" />;
      case "comment": return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case "follow": return <UserPlus className="w-5 h-5 text-green-400" />;
      default: return <Bell className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {!isMobile && <Header />}
      <main className={`max-w-2xl mx-auto ${isMobile ? 'pt-6 pb-20 px-3' : 'pt-24 pb-10 px-4'}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <Button variant="ghost" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            Marcar todo como leído
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : notifications.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No tienes notificaciones todavía.</Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es });
              const linkTo = item.related_post_id ? `/post/${item.related_post_id}` : item.related_user?.username ? `/user/${item.related_user.username}` : undefined;

              const content = (
                <Card className={`p-4 transition-colors ${item.read ? "bg-card/50 opacity-70" : "bg-card"}`}>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{getIcon(item.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{item.related_user?.full_name || item.title}</p>
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                    </div>
                    {item.related_user && (
                        <Avatar className="w-8 h-8">
                        <AvatarImage src={item.related_user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{item.related_user.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                    )}
                  </div>
                </Card>
              );

              return linkTo ? (
                <Link key={item.id} to={linkTo} onClick={() => !item.read && handleMarkAsRead(item.id)} className="hover:opacity-90 rounded-lg block">
                  {content}
                </Link>
              ) : (
                <div key={item.id} onClick={() => !item.read && handleMarkAsRead(item.id)} className="cursor-pointer hover:opacity-90 rounded-lg">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </main>
      {isMobile && <MobileBottomNav onLogout={signOut} />}
    </div>
  );
};

export default Notifications;
