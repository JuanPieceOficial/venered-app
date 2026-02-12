
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onMediaUploaded: (urls: string[]) => void;
  maxFiles?: number;
}

const MediaUpload = ({ onMediaUploaded, maxFiles = 4 }: MediaUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading } = useFileUpload();

  // Función para limpiar todo
  const resetUpload = () => {
    previews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setSelectedFiles([]);
    setPreviews([]);
    setUploadedUrls([]);
    onMediaUploaded([]);
  };

  // Exponer la función reset al componente padre
  useEffect(() => {
    if (uploadedUrls.length === 0 && selectedFiles.length === 0) {
      // Si no hay archivos, limpiar
      resetUpload();
    }
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxFiles - selectedFiles.length);
    const newPreviews: string[] = [];

    // Validate files
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es una imagen válida`,
          variant: "destructive"
        });
        continue;
      }

      const url = URL.createObjectURL(file);
      newPreviews.push(url);
    }

    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);

    // Subir automáticamente
    try {
      console.log('Starting upload for', newFiles.length, 'files');
      const uploadPromises = newFiles.map(async (file, index) => {
        try {
          return await uploadFile(file, 'posts');
        } catch (error) {
          console.error(`Error uploading file ${index}:`, error);
          throw error;
        }
      });
      
      const urls = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', urls);
      
      setUploadedUrls(prev => {
        const newUrls = [...prev, ...urls];
        onMediaUploaded(newUrls);
        return newUrls;
      });

      toast({
        title: "¡Imágenes subidas!",
        description: `Se subieron ${urls.length} imagen(es) correctamente`
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      // Revert the preview changes if upload failed
      newPreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setSelectedFiles(prev => prev.slice(0, -newFiles.length));
      setPreviews(prev => prev.slice(0, -newPreviews.length));
    }
  };

  const removeFile = (index: number) => {
    const previewUrl = previews[index];
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      onMediaUploaded(newUrls);
      return newUrls;
    });
  };

  useEffect(() => {
    return () => {
      previews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="flex space-x-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles || uploading}
          className="text-gray-400 hover:text-white"
        >
          <Image className="w-5 h-5 mr-2" />
          {uploading ? "Subiendo..." : "Imagen"}
        </Button>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-white/20"
                onError={(e) => {
                  console.error('Error loading preview image:', e);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
