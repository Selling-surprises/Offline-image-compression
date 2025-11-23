export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export interface ProcessedImage {
  id: string;
  original: {
    file: File;
    preview: string;
    size: number;
    width: number;
    height: number;
    format: string;
  };
  compressed?: {
    blob: Blob;
    url: string;
    size: number;
    width: number;
    height: number;
    format: string;
    compressionRatio: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  progress: number;
}
