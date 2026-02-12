
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, UserPlus, UserMinus, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/PostCard";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
  created_at: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

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

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { followUser, unfollowUser, checkIfFollowing, loading: followLoading } = useFollow();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    if (!username) return;

    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Load user posts
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (!user || user.id !== profileData.id) {
        postsQuery = postsQuery.eq('is_private', false);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) throw postsError;

      setPosts(postsData || []);

      // Check if current user is following this user
      if (user && user.id !== profileData.id) {
        const following = await checkIfFollowing(profileData.id);
        setIsFollowing(following);
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    if (isFollowing) {
      const result = await unfollowUser(profile.id);
      if (result.success) {
        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
      }
    } else {
      const result = await followUser(profile.id);
      if (result.success) {
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
          <p className="text-gray-400 mb-4">El usuario que buscas no existe</p>
          <Link to="/feed">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Volver al Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const joinedDate = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: es
  });

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-white font-bold text-xl">@{profile.username}</span>
          </div>
          <Link to="/feed">
            <Button variant="ghost" className="text-white hover:bg-gray-800">
              Feed
            </Button>
          </Link>
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
                  
                  {!isOwnProfile && (
                    <div className="mt-4 md:mt-0 flex space-x-2">
                      <Button 
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={isFollowing 
                          ? "bg-gray-600 hover:bg-gray-700 text-white" 
                          : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        }
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Dejar de seguir
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Seguir
                          </>
                        )}
                      </Button>
                      <Link to={`/messages/${profile.username}`}>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {isFollowing ? "Mensaje" : "Solicitar mensaje"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex space-x-8 mt-6 pt-6 border-t border-white/20">
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

          {/* Posts */}
          <div>
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={loadUserProfile} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {isOwnProfile ? "Aún no hay publicaciones" : `${profile.full_name} no ha publicado nada aún`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
