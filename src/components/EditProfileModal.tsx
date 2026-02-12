
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from '@/hooks/use-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { profile, updateProfile } = useProfile();
  const { uploadFile, uploading } = useFileUpload();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    location: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when profile changes or modal opens
  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || ''
      });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [profile, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Subir nuevo avatar si se seleccionó uno
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, 'profiles');
      }

      const updateData = {
        ...formData,
        avatar_url: avatarUrl
      };

      const result = await updateProfile(updateData);
      
      if (result?.success) {
        toast({
          title: "Perfil actualizado",
          description: "Tu perfil se ha actualizado correctamente"
        });
        onClose();
      } else {
        throw new Error(result?.error || 'Error al actualizar perfil');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || 'Error al actualizar perfil',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                  {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-purple-500 rounded-full p-2 cursor-pointer hover:bg-purple-600 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-400">Haz clic en la cámara para cambiar tu foto</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre completo</label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre de usuario</label>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Biografía</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sitio web</label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ubicación</label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || uploading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSaving || uploading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
