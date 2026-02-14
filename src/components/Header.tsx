
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, MessageCircle, Search, Settings, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount: unreadNotifications } = useUnreadNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-4">
        <Link to="/feed" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
            </div>
        </Link>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Buscar..." className="bg-background border border-input rounded-full h-9 pl-10 pr-4 w-64 text-sm" />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Link to="/messages">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <MessageCircle className="w-5 h-5" />
            {unreadMessages > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadMessages}</span>}
          </Button>
        </Link>
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadNotifications}</span>}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <p className="font-bold">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/profile" className="w-full">Mi Perfil</Link></DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuItem>Privacidad</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-500"> <LogOut className="w-4 h-4 mr-2"/>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
