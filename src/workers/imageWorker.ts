import type { CompressionOptions, CompressionResult } from '../utils/imageCompressor';

self.onmessage = async (e: MessageEvent) => {
  try {
    const { file, options } = e.data as { file: File; options: CompressionOptions };
    const result = await processImage(file, options);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};

async function processImage(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const img = await loadImageFromFile(file);
  
  const dimensions = options.maintainResolution
    ? { width: img.width, height: img.height }
    : calculateDimensions(img.width, img.height, options.maxWidth, options.maxHeight);

  const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
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

  const blob = await canvas.convertToBlob({
    type: outputFormat,
    quality,
  });

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

async function loadImageFromFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
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
    return 'image/webp';
  }

  return 'image/avif';
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

function getQuality(format: string, options: CompressionOptions): number {
  const presets = options.mode === 'quality' ? QUALITY_PRESETS : PERCEPTUAL_PRESETS;
  const level = presets[options.level];

  if (format === 'image/webp') return level.webp;
  if (format === 'image/avif') return level.avif;
  return level.quality;
}
