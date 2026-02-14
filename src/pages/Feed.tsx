
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import MobileBottomNav from "@/components/MobileBottomNav";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      if (postsData && postsData.length > 0) {
        const postIds = postsData.map((post) => post.id);
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

  if (loading && !posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {!isMobile && <Header />}
      <main className={`max-w-2xl mx-auto ${isMobile ? 'pt-6 pb-20 px-3' : 'pt-24 pb-10 px-4'}`}>
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
                  <p className="text-muted-foreground text-lg">Aún no hay posts</p>
                </div>
              )}
            </div>
          )}
      </main>
      {isMobile && <MobileBottomNav onLogout={signOut} />}
    </div>
  );
};

export default Feed;
