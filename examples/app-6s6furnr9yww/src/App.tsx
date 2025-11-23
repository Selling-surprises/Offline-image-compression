import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, AlertCircle, Trash2, ZoomIn, ZoomOut, RotateCw, Crop, Settings } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('image/jpeg');
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(90);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请选择有效的图片文件');
        return;
      }
      setError(null);
      setSelectedFile(file);
      setOriginalSize(file.size);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = url;
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);

      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = url;
    } else {
      setError('请选择有效的图片文件');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setZoom(100);
    setRotation(0);
    setImageSize(null);
    setOriginalSize(null);
  };

  const convertImage = () => {
    if (!selectedFile || !canvasRef.current || !imageSize) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 设置画布大小
      const scale = zoom / 100;
      canvas.width = imageSize.width * scale;
      canvas.height = imageSize.height * scale;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 移动到画布中心进行旋转
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // 绘制图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 导出图片
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `转换后的图片.${targetFormat.split('/')[1]}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        },
        targetFormat,
        quality / 100
      );
    };

    img.src = previewUrl!;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-md">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              图片格式转换工具
            </h1>
          </div>
          <p className="text-gray-600 text-base">支持多种图片格式转换，简单易用的在线工具</p>
        </div>

        {/* 工具区域 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-10 border border-gray-100">

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in duration-300">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl p-12 text-center hover:border-indigo-300 hover:bg-indigo-50/70 transition-all duration-300 cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-700 block mb-1">
                    点击上传或拖拽图片到此处
                  </span>
                  <span className="text-sm text-gray-500">
                    支持 PNG、JPEG、WebP 格式
                  </span>
                </div>
              </label>
            </div>

            {previewUrl && (
              <div className="space-y-5">
                <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-700 space-x-4">
                    {imageSize && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-indigo-600">📐</span>
                        分辨率: {imageSize.width} x {imageSize.height} px
                      </span>
                    )}
                    {originalSize && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-purple-600">💾</span>
                        原始大小: {formatFileSize(originalSize)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetImage}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除
                  </button>
                </div>

                <div className="relative">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 shadow-inner">
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-full h-full object-contain transition-transform duration-300"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                  
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-2 flex gap-1 border border-gray-200">
                    <button
                      onClick={() => setZoom(Math.max(10, zoom - 10))}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200 text-gray-700 hover:text-indigo-600"
                      title="缩小"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200 text-gray-700 hover:text-indigo-600"
                      title="放大"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setRotation((r) => r + 90)}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200 text-gray-700 hover:text-indigo-600"
                      title="旋转"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all duration-200"
                  >
                    <Settings className="w-5 h-5" />
                    高级设置
                    <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          图片质量: <span className="text-indigo-600">{quality}%</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>低质量</span>
                          <span>高质量</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4">
                    <select
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 bg-white font-medium text-gray-700"
                    >
                      <option value="image/jpeg">📄 JPEG 格式</option>
                      <option value="image/png">🖼️ PNG 格式</option>
                      <option value="image/webp">✨ WebP 格式</option>
                    </select>

                    <button
                      onClick={convertImage}
                      className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      转换并下载
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;