import { useState, useCallback } from 'react';
import { Download, Trash2, Settings2, Image as ImageIcon, CheckCircle2, Clock, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImageUploadZone from '@/components/ImageUploadZone';
import CompressionSettings from '@/components/CompressionSettings';
import ImagePreviewCard from '@/components/ImagePreviewCard';
import type { ProcessedImage } from '@/types';
import type { CompressionOptions } from '@/utils/imageCompressor';
import { getImageInfo, compressImage, downloadBlob, formatFileSize } from '@/utils/imageCompressor';

export default function CompressorPage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [options, setOptions] = useState<CompressionOptions>({
    format: 'auto',
    mode: 'smart',
    level: 'medium',
    maintainResolution: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newImages: ProcessedImage[] = [];

    for (const file of files) {
      try {
        const info = await getImageInfo(file);
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          original: info,
          status: 'pending',
          progress: 0,
        });
      } catch (error) {
        toast({
          title: '加载失败',
          description: `无法加载图片 ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setImages((prev) => [...prev, ...newImages]);
  }, [toast]);

  const handleCompress = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending');
    if (pendingImages.length === 0) {
      toast({
        title: '没有待处理的图片',
        description: '请先上传图片',
      });
      return;
    }

    setIsProcessing(true);

    for (const image of pendingImages) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'processing', progress: 50 } : img
        )
      );

      try {
        const result = await compressImage(image.original.file, options);
        
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, compressed: result, status: 'completed', progress: 100 }
              : img
          )
        );

        toast({
          title: '压缩成功',
          description: `${image.original.file.name} 已压缩 ${result.compressionRatio.toFixed(1)}%`,
        });
      } catch (error) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, status: 'error', error: (error as Error).message, progress: 0 }
              : img
          )
        );

        toast({
          title: '压缩失败',
          description: `${image.original.file.name}: ${(error as Error).message}`,
          variant: 'destructive',
        });
      }
    }

    setIsProcessing(false);
  }, [images, options, toast]);

  const handleDownloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed' && img.compressed);
    
    if (completedImages.length === 0) {
      toast({
        title: '没有可下载的图片',
        description: '请先压缩图片',
      });
      return;
    }

    for (const image of completedImages) {
      if (image.compressed) {
        const extension = image.compressed.format.split('/')[1];
        const originalName = image.original.file.name.split('.')[0];
        const filename = `${originalName}_compressed.${extension}`;
        downloadBlob(image.compressed.blob, filename);
      }
    }

    toast({
      title: '下载完成',
      description: `已下载 ${completedImages.length} 张图片`,
    });
  }, [images, toast]);

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.original.preview);
        if (image.compressed) {
          URL.revokeObjectURL(image.compressed.url);
        }
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    for (const image of images) {
      URL.revokeObjectURL(image.original.preview);
      if (image.compressed) {
        URL.revokeObjectURL(image.compressed.url);
      }
    }
    setImages([]);
    toast({
      title: '已清空',
      description: '所有图片已移除',
    });
  }, [images, toast]);

  const stats = {
    total: images.length,
    completed: images.filter((img) => img.status === 'completed').length,
    pending: images.filter((img) => img.status === 'pending').length,
    totalOriginalSize: images.reduce((sum, img) => sum + img.original.size, 0),
    totalCompressedSize: images.reduce((sum, img) => sum + (img.compressed?.size || 0), 0),
  };

  const totalSaved = stats.totalOriginalSize - stats.totalCompressedSize;
  const totalRatio = stats.totalOriginalSize > 0 
    ? ((totalSaved / stats.totalOriginalSize) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="@container max-w-[1600px] mx-auto p-4 xl:p-8 relative z-10">
        <div className="space-y-6">
          {/* 标题区域 */}
          <div className="text-center space-y-3 animate-scale-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">完全离线 · 保护隐私</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold gradient-text">
              离线图片压缩工具
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              完全在浏览器本地运行，保护您的隐私，无需上传到服务器
            </p>
          </div>

          {/* 统计卡片 */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 animate-scale-in">
              <div className="group relative bg-gradient-to-br from-card to-card/50 p-5 rounded-xl border shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-smooth" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">总图片数</div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.total}</div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-card to-card/50 p-5 rounded-xl border shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-smooth" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <div className="text-sm text-muted-foreground">已完成</div>
                  </div>
                  <div className="text-3xl font-bold text-success">{stats.completed}</div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-card to-card/50 p-5 rounded-xl border shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-warning/10 rounded-full blur-2xl group-hover:bg-warning/20 transition-smooth" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                    <div className="text-sm text-muted-foreground">待处理</div>
                  </div>
                  <div className="text-3xl font-bold text-warning">{stats.pending}</div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-card to-card/50 p-5 rounded-xl border shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-smooth" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-success" />
                    </div>
                    <div className="text-sm text-muted-foreground">节省空间</div>
                  </div>
                  <div className="text-3xl font-bold text-success">{formatFileSize(totalSaved)}</div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-xl border border-primary/20 shadow-primary hover:shadow-glow transition-smooth overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-smooth" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-sm text-primary font-medium">总压缩率</div>
                  </div>
                  <div className="text-3xl font-bold gradient-text">{totalRatio.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <ImageUploadZone onFilesSelected={handleFilesSelected} disabled={isProcessing} />

              {images.length > 0 && (
                <div className="space-y-4 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings2 className="w-5 h-5 text-primary" />
                      </div>
                      图片列表
                    </h2>
                    <div className="flex gap-2">
                      {stats.completed > 0 && (
                        <Button onClick={handleDownloadAll} className="gap-2 shadow-primary">
                          <Download className="w-4 h-4" />
                          下载全部
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleClearAll} className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        清空
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {images.map((image) => (
                      <ImagePreviewCard key={image.id} image={image} onRemove={handleRemove} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <CompressionSettings options={options} onChange={setOptions} />

              {images.length > 0 && (
                <Button
                  onClick={handleCompress}
                  disabled={isProcessing || stats.pending === 0}
                  className="w-full h-14 text-lg font-semibold shadow-primary hover:shadow-glow transition-smooth relative overflow-hidden group"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-light/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
                  <span className="relative">
                    {isProcessing ? '处理中...' : `开始压缩 (${stats.pending})`}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
