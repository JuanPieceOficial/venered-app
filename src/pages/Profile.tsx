import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageCircle, UserPlus, MapPin, Calendar, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/PostCard";
import EditProfileModal from "@/components/EditProfileModal";
import PrivacySettingsModal from "@/components/PrivacySettingsModal";
import FriendsPanel from "@/components/FriendsPanel";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  image_urls?: string[];
  video_url?: string;
  is_private?: boolean;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    if (!user) return;

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error: any) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white">Error al cargar el perfil</p>
      </div>
    );
  }

  const joinedDate = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: es
  });

  const publicPosts = posts.filter((post) => !post.is_private);
  const privatePosts = posts.filter((post) => post.is_private);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">Venered</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Feed
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              <Shield className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-16 sm:pt-20 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="bg-black/40 backdrop-blur-md border-white/20 mb-8">
            <div className="relative">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg"></div>
              
              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16">
                  <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white">
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-white">
                      <h1 className="text-3xl font-bold mb-1">{profile.full_name}</h1>
                      <p className="text-gray-400 mb-2">@{profile.username}</p>
                      {profile.bio && (
                        <p className="text-gray-300 mb-4 max-w-md">{profile.bio}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {profile.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {profile.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Se unió {joinedDate}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <Button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Editar perfil
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 sm:gap-8 mt-6 pt-6 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{profile.posts_count}</p>
                    <p className="text-gray-400 text-sm">Publicaciones</p>
                  </div>
                  <Link to={`/followers/${profile.username}/followers`} className="text-center hover:bg-white/10 rounded-lg p-2 transition-colors">
                    <p className="text-2xl font-bold text-white">{profile.followers_count}</p>
                    <p className="text-gray-400 text-sm">Seguidores</p>
                  </Link>
                  <Link to={`/followers/${profile.username}/following`} className="text-center hover:bg-white/10 rounded-lg p-2 transition-colors">
                    <p className="text-2xl font-bold text-white">{profile.following_count}</p>
                    <p className="text-gray-400 text-sm">Siguiendo</p>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Content Tabs */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="flex w-full gap-2 overflow-x-auto bg-black/40 backdrop-blur-md border-white/20 px-2">
                <TabsTrigger value="posts" className="text-white data-[state=active]:bg-purple-500 whitespace-nowrap">
                Publicaciones
              </TabsTrigger>
                <TabsTrigger value="private" className="text-white data-[state=active]:bg-purple-500 whitespace-nowrap">
                Privadas
              </TabsTrigger>
                <TabsTrigger value="reels" className="text-white data-[state=active]:bg-purple-500 whitespace-nowrap">
                Reels
              </TabsTrigger>
                <TabsTrigger value="friends" className="text-white data-[state=active]:bg-purple-500 whitespace-nowrap">
                Amigos
              </TabsTrigger>
                <TabsTrigger value="about" className="text-white data-[state=active]:bg-purple-500 whitespace-nowrap">
                Acerca de
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {publicPosts.length > 0 ? (
                <div>
                  {publicPosts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={loadUserPosts} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Aún no hay publicaciones publicas</p>
                  <p className="text-gray-500 text-sm mt-2">Comparte tu primer post en el feed</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="private" className="mt-6">
              {privatePosts.length > 0 ? (
                <div>
                  {privatePosts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={loadUserPosts} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No tienes publicaciones privadas</p>
                  <p className="text-gray-500 text-sm mt-2">Cambia la visibilidad desde los tres puntos</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reels" className="mt-6">
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Aún no hay reels</p>
                <p className="text-gray-500 text-sm mt-2">Los reels aparecerán aquí cuando los subas</p>
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <FriendsPanel />
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card className="bg-black/40 backdrop-blur-md border-white/20 p-6">
                <div className="text-white space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Información personal</h3>
                    <div className="space-y-2 text-gray-300">
                      <p><span className="text-gray-400">Nombre completo:</span> {profile.full_name}</p>
                      <p><span className="text-gray-400">Nombre de usuario:</span> @{profile.username}</p>
                      {profile.location && (
                        <p><span className="text-gray-400">Ubicación:</span> {profile.location}</p>
                      )}
                      {profile.website && (
                        <p><span className="text-gray-400">Sitio web:</span> {profile.website}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      
      <PrivacySettingsModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
    </div>
  );
};

export default Profile;
