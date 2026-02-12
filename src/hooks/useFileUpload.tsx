
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, category: 'posts' | 'messages' | 'profiles' = 'posts') => {
    try {
      setUploading(true);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen.');
      }

      const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string | undefined;
      if (!imgbbKey) {
        throw new Error('Falta configurar VITE_IMGBB_API_KEY');
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileNameBase = `${category}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const fileName = `${fileNameBase}.${fileExt}`;

      const formData = new FormData();
      formData.append('image', file, fileName);
      formData.append('name', fileNameBase);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error en la subida a ImgBB');
      }

      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error?.message || 'Error en la subida a ImgBB');
      }

      const publicUrl = payload?.data?.url || payload?.data?.display_url;
      if (!publicUrl) {
        throw new Error('No se obtuvo URL publica de ImgBB');
      }
      toast({
        title: "¡Imagen subida!",
        description: "La imagen se ha subido correctamente",
      });
      
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error al subir imagen",
        description: error.message || "Error desconocido al subir imagen",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
