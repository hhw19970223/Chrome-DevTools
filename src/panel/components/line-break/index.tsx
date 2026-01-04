import { useMemo } from 'react';

/**
 * 文本自动换行
 */
export function LineBreak({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const lines = useMemo<string[]>(() => {
    return text.split('\n');
  }, [text]);

  return (
    <>
      {lines.map((line, index) => (
        <span
          className={`text-colorText overflow-hidden text-sm/5.5 ${className}`}
          key={index}
        >
          {index > 0 ? <br /> : null}
          <span>{line}</span>
        </span>
      ))}
    </>
  );
}
