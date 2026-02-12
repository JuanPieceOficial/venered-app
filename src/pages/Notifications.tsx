import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Bell, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
  const { user } = useAuth();
  const { unreadCount, markAllAsRead } = useUnreadNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select(
            `
              *,
              related_user:profiles!notifications_related_user_id_fkey (
                username,
                full_name,
                avatar_url
              ),
              related_post:posts!notifications_related_post_id_fkey (
                id,
                content,
                image_urls
              )
            `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          try {
            const { data, error } = await supabase
              .from("notifications")
              .select(
                `
                  *,
                  related_user:profiles!notifications_related_user_id_fkey (
                    username,
                    full_name,
                    avatar_url
                  ),
                  related_post:posts!notifications_related_post_id_fkey (
                    id,
                    content,
                    image_urls
                  )
                `
              )
              .eq("id", payload.new.id)
              .single();

            if (error) throw error;
            if (data) {
              setNotifications((prev) => [data, ...prev]);
            }
          } catch (err) {
            console.error("Error fetching new notification:", err);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-pink-400" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-white font-bold text-xl">Notificaciones</span>
          </div>
          <Button
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Marcar todo como leido
          </Button>
        </div>
      </nav>

      <div className="pt-16 sm:pt-20 px-3 sm:px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {notifications.length === 0 ? (
            <Card className="bg-gray-900/60 border-gray-800 p-6 text-center text-gray-300">
              No tienes notificaciones todavia.
            </Card>
          ) : (
            notifications.map((item) => {
              const timeAgo = formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: es
              });

              const linkTo = item.related_post_id
                ? `/post/${item.related_post_id}`
                : item.related_user?.username
                  ? `/user/${item.related_user.username}`
                  : undefined;

              const content = (
                <Card
                  className={`bg-gray-900/60 border-gray-800 p-4 transition-colors ${
                    item.read ? "opacity-70" : "border-purple-500/40"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{getIcon(item.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-semibold">
                          {item.related_user?.full_name || item.title}
                        </p>
                        <span className="text-xs text-gray-400">{timeAgo}</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {item.message}
                      </p>
                    </div>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={item.related_user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                        {item.related_user?.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Card>
              );

              return linkTo ? (
                <Link
                  key={item.id}
                  to={linkTo}
                  onClick={() => markAsRead(item.id)}
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id} onClick={() => markAsRead(item.id)}>
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
