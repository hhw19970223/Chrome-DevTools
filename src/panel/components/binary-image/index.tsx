import { useEffect, useState, useRef } from "react";

interface BinaryImageProps {
  data: ArrayBuffer | Uint8Array | number[];
  filename?: string;
  alt?: string;
  className?: string;
}

/**
 * 二进制图片组件
 * 将二进制数据转换为可显示的图片URL，并自动管理内存
 */
export function BinaryImage({ data, filename, alt, className }: BinaryImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // 清理之前的URL
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    try {
      // 根据文件名获取MIME类型
      const mimeType = getMimeType(filename);
      
      // 确保数据转换为适合 Blob 的格式
      let blobData: BlobPart;
      if (data instanceof ArrayBuffer) {
        blobData = data;
      } else if (data instanceof Uint8Array) {
        blobData = data as any; // TypeScript 对 Uint8Array 的泛型处理有问题，需要断言
      } else if (Array.isArray(data)) {
        // 如果是普通数组，转换为 Uint8Array
        blobData = new Uint8Array(data) as any;
      } else {
        throw new Error('不支持的数据格式');
      }
      
      // 创建Blob对象
      const blob = new Blob([blobData], { type: mimeType });
      
      // 创建URL
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setImageUrl(url);
      setError(null);
    } catch (err) {
      console.error('创建图片URL失败:', err, data);
      setError('图片加载失败');
      setImageUrl(null);
    }

    // 清理函数：组件卸载或data变化时释放URL
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [data, filename]);

  // 根据文件名获取MIME类型
  const getMimeType = (filename?: string): string => {
    if (!filename) return 'image/png';
    
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
    };
    
    return mimeTypes[ext || ''] || 'image/png';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm">
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载中...
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || filename || '图片'}
      className={className}
      onError={() => {
        console.error(`图片加载失败: ${filename}`);
        setError('图片显示失败');
      }}
    />
  );
}

