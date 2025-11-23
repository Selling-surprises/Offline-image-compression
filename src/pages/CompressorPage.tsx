import { useState, useCallback } from 'react';
import { Download, Trash2, Settings2 } from 'lucide-react';
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
    mode: 'quality',
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
    <div className="min-h-screen bg-background">
      <div className="@container max-w-[1600px] mx-auto p-4 xl:p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl xl:text-4xl font-bold gradient-text">
              离线图片压缩工具
            </h1>
            <p className="text-muted-foreground">
              完全在浏览器本地运行，保护您的隐私，无需上传到服务器
            </p>
          </div>

          {stats.total > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-card p-4 rounded-lg border shadow-card">
                <div className="text-sm text-muted-foreground">总图片数</div>
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-card">
                <div className="text-sm text-muted-foreground">已完成</div>
                <div className="text-2xl font-bold text-success">{stats.completed}</div>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-card">
                <div className="text-sm text-muted-foreground">待处理</div>
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-card">
                <div className="text-sm text-muted-foreground">节省空间</div>
                <div className="text-2xl font-bold text-success">{formatFileSize(totalSaved)}</div>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-card">
                <div className="text-sm text-muted-foreground">总压缩率</div>
                <div className="text-2xl font-bold text-primary">{totalRatio.toFixed(1)}%</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <ImageUploadZone onFilesSelected={handleFilesSelected} disabled={isProcessing} />

              {images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      图片列表
                    </h2>
                    <div className="flex gap-2">
                      {stats.completed > 0 && (
                        <Button onClick={handleDownloadAll} className="gap-2">
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
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isProcessing ? '处理中...' : `开始压缩 (${stats.pending})`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
