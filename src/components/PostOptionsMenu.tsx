
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Flag, BookmarkPlus, Share2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PostOptionsMenuProps {
  postId: string;
  postUserId: string;
  onPostDeleted?: () => void;
  onShare?: () => void;
  onChangeVisibility?: () => void;
}

const PostOptionsMenu = ({
  postId,
  postUserId,
  onPostDeleted,
  onShare,
  onChangeVisibility
}: PostOptionsMenuProps) => {
  const { user } = useAuth();
  const isOwnPost = user?.id === postUserId;

  const handleDeletePost = async () => {
    if (!user || !isOwnPost) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Extra security check

      if (error) throw error;

      toast({
        title: "Publicación eliminada",
        description: "Tu publicación ha sido eliminada exitosamente"
      });

      if (onPostDeleted) {
        onPostDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación",
        variant: "destructive"
      });
    }
  };

  const handleSavePost = () => {
    toast({
      title: "Funcionalidad próximamente",
      description: "La opción de guardar posts estará disponible pronto"
    });
  };

  const handleReportPost = () => {
    toast({
      title: "Funcionalidad próximamente",
      description: "La opción de reportar posts estará disponible pronto"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-gray-900 border-gray-700 text-white"
        sideOffset={5}
      >
        <DropdownMenuItem
          onClick={() => onShare?.()}
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir
        </DropdownMenuItem>

        {!isOwnPost && (
          <>
            <DropdownMenuItem 
              onClick={handleSavePost}
              className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Guardar
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={handleReportPost}
              className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-red-400"
            >
              <Flag className="w-4 h-4 mr-2" />
              Reportar
            </DropdownMenuItem>
          </>
        )}

        {isOwnPost && (
          <>
            <DropdownMenuItem
              onClick={() => onChangeVisibility?.()}
              className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            >
              <Eye className="w-4 h-4 mr-2" />
              Cambiar visibilidad
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-gray-700" />

            <DropdownMenuItem 
              onClick={handleDeletePost}
              className="cursor-pointer hover:bg-red-900 focus:bg-red-900 text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostOptionsMenu;
