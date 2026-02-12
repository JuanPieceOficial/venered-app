
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, EyeOff, Users, MessageSquare } from 'lucide-react';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacySettingsModal = ({ isOpen, onClose }: PrivacySettingsModalProps) => {
  const { settings, loading, updating, updatePrivacySettings } = usePrivacySettings();
  
  if (loading || !settings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white max-w-lg">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleToggle = async (key: string, value: boolean) => {
    await updatePrivacySettings({ [key]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configuraciones de Privacidad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del perfil */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Información del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-location" className="text-sm">
                  Ocultar ubicación
                </Label>
                <Switch
                  id="hide-location"
                  checked={settings.hide_location}
                  onCheckedChange={(checked) => handleToggle('hide_location', checked)}
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hide-website" className="text-sm">
                  Ocultar sitio web
                </Label>
                <Switch
                  id="hide-website"
                  checked={settings.hide_website}
                  onCheckedChange={(checked) => handleToggle('hide_website', checked)}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-followers" className="text-sm">
                  Ocultar número de seguidores
                </Label>
                <Switch
                  id="hide-followers"
                  checked={settings.hide_followers_count}
                  onCheckedChange={(checked) => handleToggle('hide_followers_count', checked)}
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hide-following" className="text-sm">
                  Ocultar número de seguidos
                </Label>
                <Switch
                  id="hide-following"
                  checked={settings.hide_following_count}
                  onCheckedChange={(checked) => handleToggle('hide_following_count', checked)}
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hide-posts" className="text-sm">
                  Ocultar número de publicaciones
                </Label>
                <Switch
                  id="hide-posts"
                  checked={settings.hide_posts_count}
                  onCheckedChange={(checked) => handleToggle('hide_posts_count', checked)}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuraciones de contenido */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Contenido y Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="private-posts" className="text-sm">
                  Publicaciones privadas
                </Label>
                <Switch
                  id="private-posts"
                  checked={settings.private_posts}
                  onCheckedChange={(checked) => handleToggle('private_posts', checked)}
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-messages" className="text-sm">
                  Permitir mensajes de desconocidos
                </Label>
                <Switch
                  id="allow-messages"
                  checked={settings.allow_message_from_strangers}
                  onCheckedChange={(checked) => handleToggle('allow_message_from_strangers', checked)}
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="online-status" className="text-sm">
                  Mostrar estado en línea
                </Label>
                <Switch
                  id="online-status"
                  checked={settings.show_online_status}
                  onCheckedChange={(checked) => handleToggle('show_online_status', checked)}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-white/20" />

          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacySettingsModal;
