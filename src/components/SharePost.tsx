
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SharePostProps {
  postId: string;
  postContent: string;
  authorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SharePost = ({ postId, postContent, authorName, open, onOpenChange }: SharePostProps) => {
  const shareUrl = `${window.location.origin}/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de la publicación se ha copiado al portapapeles"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Compartir publicación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button 
            onClick={handleCopyLink}
            className="w-full justify-start bg-white/10 hover:bg-white/20 text-white"
          >
            <Copy className="w-4 h-4 mr-3" />
            Copiar enlace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePost;
