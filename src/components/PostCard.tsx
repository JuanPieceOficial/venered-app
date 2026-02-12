
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import Comments from "./Comments";
import SharePost from "./SharePost";
import PostOptionsMenu from "./PostOptionsMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

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

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
  initialIsLiked?: boolean;
}

const PostCard = ({ post, onUpdate, initialIsLiked }: PostCardProps) => {
  const { user } = useAuth();
  const isOwnPost = user?.id === post.user_id;
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (initialIsLiked !== undefined) {
      setIsLiked(initialIsLiked);
      return;
    }

    if (user) {
      checkIfLiked();
    }
  }, [user, post.id, initialIsLiked]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return;
      }

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id });

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: es
  });

  const handleVisibilityUpdate = async (isPrivate: boolean) => {
    if (!user || !isOwnPost) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_private: isPrivate })
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Visibilidad actualizada",
        description: isPrivate ? "La publicacion ahora es privada" : "La publicacion ahora es publica"
      });

      setShowVisibility(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la visibilidad",
        variant: "destructive"
      });
    }
  };

  return (
      <Card className="bg-black/40 backdrop-blur-md border-white/20 mb-6">
        <div className="p-4 sm:p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link to={`/user/${post.profiles.username}`}>
              <Avatar className="w-10 h-10 cursor-pointer">
                <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {post.profiles.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/user/${post.profiles.username}`} className="hover:underline">
                <h3 className="text-white font-semibold">{post.profiles.full_name}</h3>
              </Link>
              <p className="text-gray-400 text-sm">@{post.profiles.username} • {timeAgo}</p>
            </div>
          </div>
          
          <PostOptionsMenu 
            postId={post.id} 
            postUserId={post.user_id} 
            onPostDeleted={onUpdate} 
            onShare={() => setShowShare(true)}
            onChangeVisibility={() => setShowVisibility(true)}
          />
        </div>

        {/* Post Content */}
        {post.content && (
          <div className="mb-4">
            <p className="text-white whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Post Media */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4">
            <div className="grid gap-2">
              {post.image_urls.length === 1 ? (
                <img
                  src={post.image_urls[0]}
                  alt="Post image"
                  className="w-full max-h-96 object-cover rounded-lg cursor-pointer"
                  onClick={() => setSelectedImage(post.image_urls?.[0] || null)}
                />
              ) : (
                <div className={`grid gap-2 ${post.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {post.image_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedImage(url)}
                      />
                      {index === 3 && post.image_urls!.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl font-bold">+{post.image_urls!.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {post.video_url && (
          <div className="mb-4">
            <video
              src={post.video_url}
              controls
              className="w-full max-h-96 rounded-lg"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || 0}</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Comments postId={post.id} isVisible={showComments} />
          </div>
        )}

        {/* Share Modal */}
        <SharePost
          postId={post.id}
          postContent={post.content}
          authorName={post.profiles.full_name}
          open={showShare}
          onOpenChange={setShowShare}
        />

        <Dialog open={showVisibility} onOpenChange={setShowVisibility}>
          <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Visibilidad de la publicacion</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                onClick={() => handleVisibilityUpdate(false)}
                variant={post.is_private ? "outline" : "default"}
                className={post.is_private ? "border-white/20" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"}
                disabled={!isOwnPost}
              >
                Publica
              </Button>
              <Button
                onClick={() => handleVisibilityUpdate(true)}
                variant={post.is_private ? "default" : "outline"}
                className={post.is_private ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : "border-white/20"}
                disabled={!isOwnPost}
              >
                Privada
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 p-2">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default PostCard;
