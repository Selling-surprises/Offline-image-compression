import { Download, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ProcessedImage } from '@/types';
import { formatFileSize, downloadBlob } from '@/utils/imageCompressor';

interface ImagePreviewCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
}

export default function ImagePreviewCard({ image, onRemove }: ImagePreviewCardProps) {
  const handleDownload = () => {
    if (!image.compressed) return;
    
    const extension = image.compressed.format.split('/')[1];
    const originalName = image.original.file.name.split('.')[0];
    const filename = `${originalName}_compressed.${extension}`;
    
    downloadBlob(image.compressed.blob, filename);
  };

  const getStatusIcon = () => {
    switch (image.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (image.status) {
      case 'completed':
        return <Badge variant="default" className="bg-success">已完成</Badge>;
      case 'error':
        return <Badge variant="destructive">失败</Badge>;
      case 'processing':
        return <Badge variant="default">处理中</Badge>;
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-card transition-smooth">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-32 h-32 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
            <img
              src={image.compressed?.url || image.original.preview}
              alt={image.original.file.name}
              className="w-full h-full object-cover"
            />
            {image.status === 'processing' && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{image.original.file.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon()}
                  {getStatusBadge()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(image.id)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {image.status === 'processing' && (
              <Progress value={image.progress} className="h-2" />
            )}

            {image.status === 'error' && (
              <p className="text-sm text-destructive">{image.error}</p>
            )}

            {image.status === 'completed' && image.compressed && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">原始大小：</span>
                    <span className="font-medium">{formatFileSize(image.original.size)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">压缩后：</span>
                    <span className="font-medium text-success">{formatFileSize(image.compressed.size)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">原始尺寸：</span>
                    <span className="font-medium">{image.original.width} × {image.original.height}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">压缩后：</span>
                    <span className="font-medium">{image.compressed.width} × {image.compressed.height}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">压缩率：</span>
                    <span className="font-semibold text-primary ml-1">
                      {image.compressed.compressionRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Button onClick={handleDownload} size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    下载
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
