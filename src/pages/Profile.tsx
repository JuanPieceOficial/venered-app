
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/PostCard";
import EditProfileModal from "@/components/EditProfileModal";
import PrivacySettingsModal from "@/components/PrivacySettingsModal";
import FriendsPanel from "@/components/FriendsPanel";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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
        .select('*, profiles(*)')
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

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error al cargar el perfil.</p>
      </div>
    );
  }

  const joinedDate = formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: es });
  const publicPosts = posts.filter((post) => !post.is_private);
  const privatePosts = posts.filter((post) => post.is_private);

  return (
    <div className="bg-background min-h-screen">
      {!isMobile && <Header />}
      <main className={`max-w-4xl mx-auto ${isMobile ? 'pt-6 pb-20 px-3' : 'pt-24 pb-10 px-4'}`}>
          <Card className="bg-card border-border mb-8 overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16">
                  <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background">
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{profile.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-foreground">
                      <h1 className="text-3xl font-bold mb-1">{profile.full_name}</h1>
                      <p className="text-muted-foreground mb-2">@{profile.username}</p>
                      {profile.bio && <p className="text-card-foreground max-w-md">{profile.bio}</p>}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                        {profile.location && <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{profile.location}</div>}
                        <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" />Se unió {joinedDate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button onClick={() => setIsEditModalOpen(true)}>Editar perfil</Button>
                    <Button onClick={() => setIsPrivacyModalOpen(true)} variant="outline" className="ml-2">Privacidad</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 sm:gap-8 mt-6 pt-6 border-t border-border">
                  <div className="text-center"><p className="text-2xl font-bold">{profile.posts_count}</p><p className="text-muted-foreground text-sm">Publicaciones</p></div>
                  <Link to={`/followers/${profile.username}/followers`} className="text-center hover:bg-muted rounded-lg p-2 transition-colors"><p className="text-2xl font-bold">{profile.followers_count}</p><p className="text-muted-foreground text-sm">Seguidores</p></Link>
                  <Link to={`/followers/${profile.username}/following`} className="text-center hover:bg-muted rounded-lg p-2 transition-colors"><p className="text-2xl font-bold">{profile.following_count}</p><p className="text-muted-foreground text-sm">Siguiendo</p></Link>
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-card p-1 rounded-lg border-border">
              <TabsTrigger value="posts">Publicaciones</TabsTrigger>
              <TabsTrigger value="private">Privadas</TabsTrigger>
              <TabsTrigger value="reels">Reels</TabsTrigger>
              <TabsTrigger value="friends">Amigos</TabsTrigger>
              <TabsTrigger value="about">Acerca de</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-6">
              {publicPosts.length > 0 ? <div>{publicPosts.map(post => <PostCard key={post.id} post={post} onUpdate={loadUserPosts} />)}</div> : <div className="text-center py-12"><p className="text-muted-foreground text-lg">Aún no hay publicaciones.</p></div>}
            </TabsContent>
             <TabsContent value="private" className="mt-6">
              {privatePosts.length > 0 ? <div>{privatePosts.map(post => <PostCard key={post.id} post={post} onUpdate={loadUserPosts} />)}</div> : <div className="text-center py-12"><p className="text-muted-foreground text-lg">No tienes publicaciones privadas.</p></div>}
            </TabsContent>
            <TabsContent value="reels" className="mt-6"><div className="text-center py-12"><p className="text-muted-foreground text-lg">Aún no hay reels.</p></div></TabsContent>
            <TabsContent value="friends" className="mt-6"><FriendsPanel /></TabsContent>
            <TabsContent value="about" className="mt-6"><Card className="bg-card border-border p-6"><div className="space-y-4"><h3 className="text-xl font-semibold">Información</h3><p>Nombre: {profile.full_name}</p><p>Usuario: @{profile.username}</p></div></Card></TabsContent>
          </Tabs>
      </main>
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <PrivacySettingsModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      {isMobile && <MobileBottomNav onLogout={signOut} />}
    </div>
  );
};

export default Profile;
