import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function ImageUploadZone({ onFilesSelected, disabled }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFiles = useCallback((files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];

    const validFiles: File[] = [];
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!supportedFormats.includes(file.type)) {
        toast({
          title: '不支持的格式',
          description: `文件 ${file.name} 格式不支持，仅支持 JPEG、PNG、WebP、AVIF`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: `文件 ${file.name} 超过 50MB 限制`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  return (
    <Card
      className={`relative overflow-hidden transition-smooth ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className={`block p-12 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className={`p-6 rounded-full transition-smooth ${
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {isDragging ? (
              <ImageIcon className="w-12 h-12" />
            ) : (
              <Upload className="w-12 h-12" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isDragging ? '松开以上传图片' : '拖放图片到此处'}
            </h3>
            <p className="text-muted-foreground">
              或点击选择文件
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>支持格式：JPEG、PNG、WebP、AVIF</p>
            <p>单个文件最大 50MB</p>
            <p>支持批量上传</p>
          </div>
        </div>
      </label>
    </Card>
  );
}
