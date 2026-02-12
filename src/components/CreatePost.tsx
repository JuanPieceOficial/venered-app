import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MediaUpload from "./MediaUpload";

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && mediaUrls.length === 0) || !user) return;

    setIsLoading(true);
    try {
      const postData: any = {
        user_id: user.id,
        content: content.trim() || null
      };

      if (mediaUrls.length > 0) {
        postData.image_urls = mediaUrls;
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      setContent("");
      setMediaUrls([]);
      toast({
        title: "¡Post creado!",
        description: "Tu publicación se ha compartido exitosamente"
      });

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="bg-black border-gray-800 mb-6">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Textarea
                placeholder="¿Qué estás pensando?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-transparent border-none text-white placeholder:text-gray-400 resize-none text-lg"
                rows={3}
              />

              <MediaUpload onMediaUploaded={setMediaUrls} maxFiles={4} />

              <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/20">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={(!content.trim() && mediaUrls.length === 0) || isLoading}
                >
                  {isLoading ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default CreatePost;