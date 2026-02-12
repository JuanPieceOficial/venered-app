
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  isFollowing?: boolean;
}

const Followers = () => {
  const { username, tab } = useParams<{ username: string; tab: string }>();
  const { user } = useAuth();
  const { followUser, unfollowUser, checkIfFollowing, loading: followLoading } = useFollow();
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string>("");

  useEffect(() => {
    if (username) {
      loadUserData();
    }
  }, [username]);

  const loadUserData = async () => {
    if (!username) return;

    try {
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      setProfileId(profile.id);
      await Promise.all([loadFollowers(profile.id), loadFollowing(profile.id)]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            followers_count,
            following_count
          )
        `)
        .eq('following_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      const followersData = data?.map(item => item.follower).filter(Boolean) || [];
      
      // Check if current user follows each of these users
      const followersWithStatus = await Promise.all(
        followersData.map(async (follower) => {
          if (user && user.id !== follower.id) {
            const isFollowing = await checkIfFollowing(follower.id);
            return { ...follower, isFollowing };
          }
          return follower;
        })
      );

      setFollowers(followersWithStatus);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const loadFollowing = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            followers_count,
            following_count
          )
        `)
        .eq('follower_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      const followingData = data?.map(item => item.following).filter(Boolean) || [];
      
      // Check if current user follows each of these users
      const followingWithStatus = await Promise.all(
        followingData.map(async (followingUser) => {
          if (user && user.id !== followingUser.id) {
            const isFollowing = await checkIfFollowing(followingUser.id);
            return { ...followingUser, isFollowing };
          }
          return followingUser;
        })
      );

      setFollowing(followingWithStatus);
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  const handleFollowToggle = async (targetUser: User) => {
    if (!user || user.id === targetUser.id) return;

    const success = targetUser.isFollowing 
      ? await unfollowUser(targetUser.id)
      : await followUser(targetUser.id);

    if (success.success) {
      // Update the user's follow status in both lists
      setFollowers(prev => prev.map(u => 
        u.id === targetUser.id 
          ? { ...u, isFollowing: !u.isFollowing }
          : u
      ));
      setFollowing(prev => prev.map(u => 
        u.id === targetUser.id 
          ? { ...u, isFollowing: !u.isFollowing }
          : u
      ));
    }
  };

  const UserCard = ({ user: targetUser }: { user: User }) => (
    <Card className="bg-black/40 backdrop-blur-md border-white/20 p-4">
      <div className="flex items-center justify-between">
        <Link to={`/user/${targetUser.username}`} className="flex items-center space-x-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={targetUser.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {targetUser.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h3 className="font-semibold">{targetUser.full_name}</h3>
            <p className="text-gray-400 text-sm">@{targetUser.username}</p>
            <p className="text-gray-500 text-xs">
              {targetUser.followers_count} seguidores • {targetUser.following_count} siguiendo
            </p>
          </div>
        </Link>
        
        {user && user.id !== targetUser.id && (
          <Button
            onClick={() => handleFollowToggle(targetUser)}
            disabled={followLoading}
            size="sm"
            className={targetUser.isFollowing 
              ? "bg-gray-600 hover:bg-gray-700 text-white" 
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }
          >
            {targetUser.isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                Siguiendo
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Seguir
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={`/user/${username}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-white font-bold text-xl">@{username}</span>
          </div>
          <Link to="/feed">
            <Button variant="ghost" className="text-white hover:bg-gray-800">
              Feed
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue={tab || "followers"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-md border-white/20">
              <TabsTrigger 
                value="followers" 
                className="text-white data-[state=active]:bg-purple-500"
              >
                Seguidores ({followers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="text-white data-[state=active]:bg-purple-500"
              >
                Siguiendo ({following.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="mt-6 space-y-4">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <UserCard key={follower.id} user={follower} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No hay seguidores aún</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-6 space-y-4">
              {following.length > 0 ? (
                following.map((followingUser) => (
                  <UserCard key={followingUser.id} user={followingUser} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No sigue a nadie aún</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Followers;
