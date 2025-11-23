export interface CompressionOptions {
  format: 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';
  mode: 'quality' | 'perceptual';
  level: 'light' | 'medium' | 'deep';
  maintainResolution: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface CompressionResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  compressionRatio: number;
}

export interface ImageInfo {
  file: File;
  preview: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

const QUALITY_PRESETS = {
  light: { quality: 0.9, webp: 0.85, avif: 0.85 },
  medium: { quality: 0.8, webp: 0.75, avif: 0.75 },
  deep: { quality: 0.7, webp: 0.65, avif: 0.65 },
};

const PERCEPTUAL_PRESETS = {
  light: { quality: 0.95, webp: 0.90, avif: 0.90 },
  medium: { quality: 0.90, webp: 0.85, avif: 0.85 },
  deep: { quality: 0.85, webp: 0.80, avif: 0.80 },
};

export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    
    img.src = url;
  });
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  const img = await loadImage(file);
  const preview = URL.createObjectURL(file);
  
  return {
    file,
    preview,
    width: img.width,
    height: img.height,
    size: file.size,
    format: file.type,
  };
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

function selectBestFormat(file: File, options: CompressionOptions): string {
  if (options.format !== 'auto') {
    return `image/${options.format}`;
  }

  const hasAlpha = file.type === 'image/png';
  
  if (hasAlpha) {
    if (supportsFormat('image/webp')) return 'image/webp';
    return 'image/png';
  }

  if (supportsFormat('image/avif')) return 'image/avif';
  if (supportsFormat('image/webp')) return 'image/webp';
  return 'image/jpeg';
}

function supportsFormat(mimeType: string): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
}

function getQuality(format: string, options: CompressionOptions): number {
  const presets = options.mode === 'quality' ? QUALITY_PRESETS : PERCEPTUAL_PRESETS;
  const level = presets[options.level];

  if (format === 'image/webp') return level.webp;
  if (format === 'image/avif') return level.avif;
  return level.quality;
}

export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const img = await loadImage(file);
  
  const dimensions = options.maintainResolution
    ? { width: img.width, height: img.height }
    : calculateDimensions(img.width, img.height, options.maxWidth, options.maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  if (options.mode === 'perceptual') {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

  const outputFormat = selectBestFormat(file, options);
  const quality = getQuality(outputFormat, options);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('图片压缩失败'));
        }
      },
      outputFormat,
      quality
    );
  });

  if (file.type === 'image/jpeg' && outputFormat === 'image/png') {
    if (blob.size >= file.size) {
      return compressImage(file, { ...options, format: 'jpeg' });
    }
  }

  const url = URL.createObjectURL(blob);
  const compressionRatio = ((1 - blob.size / file.size) * 100);

  return {
    blob,
    url,
    size: blob.size,
    width: dimensions.width,
    height: dimensions.height,
    format: outputFormat,
    compressionRatio: Math.max(0, compressionRatio),
  };
}

export async function compressImageWithWorker(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  if (file.size < 5 * 1024 * 1024) {
    return compressImage(file, options);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/imageWorker.ts', import.meta.url),
      { type: 'module' }
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('处理超时'));
    }, 30000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data.result);
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ file, options });
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
