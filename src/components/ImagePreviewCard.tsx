import { Download, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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
        return <Badge variant="default" className="bg-success hover:bg-success">已完成</Badge>;
      case 'error':
        return <Badge variant="destructive">失败</Badge>;
      case 'processing':
        return <Badge variant="default" className="animate-pulse">处理中</Badge>;
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-smooth border-l-4 border-l-primary/50 group animate-scale-in">
      <CardContent className="p-5">
        <div className="flex gap-5">
          {/* 图片预览 */}
          <div className="relative w-36 h-36 flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/50 rounded-xl overflow-hidden shadow-card">
            <img
              src={image.compressed?.url || image.original.preview}
              alt={image.original.file.name}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            />
            {image.status === 'processing' && (
              <div className="absolute inset-0 backdrop-blur-glass flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                  <div className="text-xs font-medium text-primary">处理中</div>
                </div>
              </div>
            )}
            {image.status === 'completed' && (
              <div className="absolute top-2 right-2 bg-success rounded-full p-1 shadow-card">
                <CheckCircle2 className="w-5 h-5 text-success-foreground" />
              </div>
            )}
          </div>

          {/* 信息区域 */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg truncate">{image.original.file.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon()}
                  {getStatusBadge()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(image.id)}
                className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {image.status === 'processing' && (
              <div className="space-y-2">
                <Progress value={image.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">正在压缩图片...</p>
              </div>
            )}

            {image.status === 'error' && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{image.error}</p>
              </div>
            )}

            {image.status === 'completed' && image.compressed && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gradient-to-br from-secondary to-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">原始大小</div>
                    <div className="font-semibold">{formatFileSize(image.original.size)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20">
                    <div className="text-xs text-success mb-1">压缩后</div>
                    <div className="font-semibold text-success">{formatFileSize(image.compressed.size)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-secondary to-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">原始尺寸</div>
                    <div className="font-semibold text-sm">{image.original.width} × {image.original.height}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-secondary to-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">压缩后</div>
                    <div className="font-semibold text-sm">{image.compressed.width} × {image.compressed.height}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">压缩率：</span>
                    <span className="font-bold text-lg gradient-text">
                      {image.compressed.compressionRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Button onClick={handleDownload} size="sm" className="gap-2 shadow-primary">
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
