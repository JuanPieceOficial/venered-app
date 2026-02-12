
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface MessageImageUploadProps {
  onImageUploaded: (url: string) => void;
}

const MessageImageUpload = ({ onImageUploaded }: MessageImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);

      // Subir automáticamente
      try {
        setIsUploading(true);
        const uploadedUrl = await uploadFile(file, 'messages');
        onImageUploaded(uploadedUrl);
        
        // Limpiar después de subir
        URL.revokeObjectURL(url);
        setSelectedFile(null);
        setPreview('');
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview('');
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*"
        className="hidden"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="text-gray-400 hover:text-white"
      >
        <Image className="w-4 h-4" />
      </Button>

      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border border-white/20"
          />
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-5 w-5 p-0"
              onClick={removeFile}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {isUploading && (
        <p className="text-xs text-gray-400">Subiendo imagen...</p>
      )}
    </div>
  );
};

export default MessageImageUpload;
