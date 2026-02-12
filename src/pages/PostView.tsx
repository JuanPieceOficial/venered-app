
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/PostCard";
import MobileBottomNav from "@/components/MobileBottomNav";
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

const PostView = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, signOut } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
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
        .eq('id', postId)
        .single();

      if (error) throw error;

      setPost(data);
    } catch (error: any) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Publicación no encontrada</h2>
          <p className="text-gray-400 mb-4">La publicación que buscas no existe o ha sido eliminada</p>
          <Link to="/feed">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Volver al Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-xl">Venered</span>
            </Link>
          </div>
          {!isMobile && (
            <Link to="/feed">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                Feed
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <div className={`pt-20 px-4 ${isMobile ? 'pb-20' : 'pb-4'}`}>
        <div className="max-w-lg mx-auto">
          <PostCard post={post} onUpdate={loadPost} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav onLogout={handleLogout} />}
    </div>
  );
};

export default PostView;
