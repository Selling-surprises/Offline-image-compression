import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
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
      className={`relative overflow-hidden transition-smooth border-2 ${
        isDragging 
          ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-glow' 
          : 'border-dashed border-border hover:border-primary/50 hover:shadow-card'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      
      <label className={`block p-12 relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className={`relative p-8 rounded-2xl transition-smooth ${
            isDragging 
              ? 'bg-gradient-primary shadow-glow scale-110' 
              : 'bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-105'
          }`}>
            {isDragging ? (
              <ImageIcon className="w-16 h-16 text-primary-foreground animate-pulse" />
            ) : (
              <Upload className="w-16 h-16 text-primary" />
            )}
            {!isDragging && (
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold">
              {isDragging ? (
                <span className="gradient-text">松开以上传图片</span>
              ) : (
                '拖放图片到此处'
              )}
            </h3>
            <p className="text-muted-foreground text-lg">
              或点击选择文件
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">支持 JPEG、PNG、WebP、AVIF</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-muted-foreground">单个文件最大 50MB</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <span className="text-muted-foreground">支持批量上传</span>
            </div>
          </div>
        </div>
      </label>
    </Card>
  );
}
