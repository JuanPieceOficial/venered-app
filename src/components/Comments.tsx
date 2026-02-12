
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface CommentsProps {
  postId: string;
  isVisible: boolean;
}

const Comments = ({ postId, isVisible }: CommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadComments();
    }
  }, [postId, isVisible]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id
        });

      if (error) throw error;

      setNewComment("");
      loadComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border-t border-white/20 pt-4 mt-4">
      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  {comment.profiles.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-semibold text-sm">{comment.profiles.full_name}</span>
                    <span className="text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-4">No hay comentarios aún</p>
      )}

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Input
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={!newComment.trim() || submitting}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Comments;
