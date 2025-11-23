import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { CompressionOptions } from '@/utils/imageCompressor';

interface CompressionSettingsProps {
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
}

export default function CompressionSettings({ options, onChange }: CompressionSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>压缩设置</CardTitle>
        <CardDescription>配置图片压缩参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="format">输出格式</Label>
          <Select
            value={options.format}
            onValueChange={(value) => onChange({ ...options, format: value as CompressionOptions['format'] })}
          >
            <SelectTrigger id="format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">自动选择</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
              <SelectItem value="avif">AVIF</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            自动模式会根据图片特征选择最佳格式
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="mode">压缩模式</Label>
          <Select
            value={options.mode}
            onValueChange={(value) => onChange({ ...options, mode: value as CompressionOptions['mode'] })}
          >
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quality">高质量压缩</SelectItem>
              <SelectItem value="perceptual">感知无损压缩</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {options.mode === 'quality' 
              ? '保持原始分辨率，适度降低质量' 
              : '使用高级算法，视觉效果更好'}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="level">优化级别</Label>
          <Select
            value={options.level}
            onValueChange={(value) => onChange({ ...options, level: value as CompressionOptions['level'] })}
          >
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">轻度优化</SelectItem>
              <SelectItem value="medium">中度优化</SelectItem>
              <SelectItem value="deep">深度优化</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {options.level === 'light' && '压缩率约 10-20%，质量损失最小'}
            {options.level === 'medium' && '压缩率约 20-40%，质量与体积平衡'}
            {options.level === 'deep' && '压缩率约 40-60%，体积最小'}
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintain-resolution">保持原始分辨率</Label>
            <p className="text-xs text-muted-foreground">
              关闭后可进一步减小文件大小
            </p>
          </div>
          <Switch
            id="maintain-resolution"
            checked={options.maintainResolution}
            onCheckedChange={(checked) => onChange({ ...options, maintainResolution: checked })}
          />
        </div>

        {!options.maintainResolution && (
          <div className="space-y-4 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-medium">最大尺寸限制</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxWidth" className="text-xs">最大宽度</Label>
                <Select
                  value={options.maxWidth?.toString() || 'none'}
                  onValueChange={(value) => 
                    onChange({ 
                      ...options, 
                      maxWidth: value === 'none' ? undefined : Number.parseInt(value) 
                    })
                  }
                >
                  <SelectTrigger id="maxWidth" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不限制</SelectItem>
                    <SelectItem value="1920">1920px</SelectItem>
                    <SelectItem value="1280">1280px</SelectItem>
                    <SelectItem value="800">800px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHeight" className="text-xs">最大高度</Label>
                <Select
                  value={options.maxHeight?.toString() || 'none'}
                  onValueChange={(value) => 
                    onChange({ 
                      ...options, 
                      maxHeight: value === 'none' ? undefined : Number.parseInt(value) 
                    })
                  }
                >
                  <SelectTrigger id="maxHeight" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不限制</SelectItem>
                    <SelectItem value="1080">1080px</SelectItem>
                    <SelectItem value="720">720px</SelectItem>
                    <SelectItem value="600">600px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
