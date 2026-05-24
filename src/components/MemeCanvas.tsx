import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { MemeRenderSpec } from '@/shared/types';
import { drawMemeCanvas, type CanvasDrawResult } from '@/shared/render';

interface MemeCanvasProps {
  plan?: MemeRenderSpec;
  caption: string;
}

export const MemeCanvas = forwardRef<HTMLCanvasElement, MemeCanvasProps>(function MemeCanvas({ plan, caption }, forwardedRef) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas || !plan) {
      return;
    }

    let cancelled = false;
    const result: CanvasDrawResult = drawMemeCanvas(canvas, plan, caption);
    if (!cancelled) {
      setPreviewUrl(result.dataUrl);
    }

    return () => {
      cancelled = true;
    };
  }, [caption, plan]);

  const ref = useMemo(() => {
    return (node: HTMLCanvasElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };
  }, [forwardedRef]);

  if (!plan) {
    return (
      <div className="bauhaus-grid relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden bg-white">
        <div className="absolute left-[10%] top-[14%] h-16 w-16 rounded-full border-4 border-[#121212] bg-[#D02020]" />
        <div className="absolute right-[12%] top-[18%] h-20 w-20 border-4 border-[#121212] bg-[#1040C0]" />
        <div className="absolute bottom-[18%] left-[18%] text-[#F0C020]">
          <div className="bauhaus-triangle border-b-[34px] border-l-[20px] border-r-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden border-b-4 border-[#121212] bg-white">
      <canvas ref={ref} width={plan.width} height={plan.height} className="hidden" />
      {previewUrl ? (
        <img src={previewUrl} alt={caption} className="h-full w-full object-contain scale-[0.94]" />
      ) : (
        <div className="bauhaus-grid flex h-full items-center justify-center bg-white text-sm font-bold uppercase tracking-[0.25em] text-[#121212]">
          Rendering meme...
        </div>
      )}
    </div>
  );
});