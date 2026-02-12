
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import UserSearch from "@/components/UserSearch";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { LogOut, MessageCircle, Search, Shield, Bell } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  image_urls?: string[];
  video_url?: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const Feed = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { unreadCount } = useUnreadMessages();
  const { unreadCount: unreadNotifications } = useUnreadNotifications();
  const isMobile = useIsMobile();
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadPosts();
      checkAdminStatus();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);

      if (user && data && data.length > 0) {
        const postIds = data.map((post) => post.id);
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        if (!likesError) {
          setLikedPostIds((likesData || []).map((like) => like.post_id));
        }
      } else {
        setLikedPostIds([]);
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowMobileSearch(false);
  };

  const handleLogoClick = () => {
    if (user) {
      navigate('/feed');
    } else {
      navigate('/');
    }
  };

  // Don't render anything if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-lg sm:text-xl">Venered</span>
            </button>
            
            {isMobile ? (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-2"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                <Search className="w-5 h-5" />
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-80">
                  <UserSearch />
                </div>
                  <Link to="/notifications" className="relative">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Bell className="w-4 h-4 mr-2" />
                      Notificaciones
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                      )}
                    </Button>
                  </Link>
                <Link to="/messages" className="relative">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-muted">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    Perfil
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile Search */}
          {isMobile && showMobileSearch && (
            <div className="mt-4 pb-4 border-t border-border pt-4">
              <UserSearch />
            </div>
          )}
        </div>
      </nav>

      <div className={`pt-16 sm:pt-20 px-3 sm:px-4 ${isMobile ? 'pb-20' : 'pb-6'}`}>
        <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-xl md:max-w-2xl'}`}>
          <CreatePost onPostCreated={loadPosts} />

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUpdate={loadPosts}
                    initialIsLiked={likedPostIds.includes(post.id)}
                  />
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">Aun no hay posts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav onLogout={handleLogout} />}
    </div>
  );
};

export default Feed;
