
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, MessageCircle, User, LogOut, Shield, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MobileBottomNavProps {
  onLogout: () => void;
}

const MobileBottomNav = ({ onLogout }: MobileBottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { unreadCount: unreadNotifications } = useUnreadNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const currentPath = location.pathname;

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-700">
      <div className="flex items-center justify-around px-4 py-3 pb-safe">
        <Link to="/feed">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-2 h-auto ${
              isActive('/feed') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Inicio</span>
          </Button>
        </Link>

        <Link to="/messages" className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-2 h-auto ${
              isActive('/messages') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Mensajes</span>
          </Button>
        </Link>

        <Link to="/notifications" className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-2 h-auto ${
              isActive('/notifications') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Alertas</span>
          </Button>
        </Link>

        {isAdmin && (
          <Link to="/admin">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center p-2 h-auto ${
                isActive('/admin') ? 'text-orange-400' : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs mt-1">Admin</span>
            </Button>
          </Link>
        )}

        <Link to="/profile">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-2 h-auto ${
              isActive('/profile') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Perfil</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center p-2 h-auto text-gray-400 hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs mt-1">Salir</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
