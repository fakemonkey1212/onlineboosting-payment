import { useEffect, useState } from 'react';
import { measureLogo } from '@/lib/logoLayout';

type Props = { src: string; alt: string; className?: string; circular?: boolean };

/** Only the current image is used; no previous-upload placeholder or persistent cache. */
export default function MerchantLogo({ src, alt, className, circular = false }: Props) {
  const [prepared, setPrepared] = useState<{ src: string; result: string }>();
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const analysis = document.createElement('canvas');
        const ratio = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
        analysis.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        analysis.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const ctx = analysis.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, analysis.width, analysis.height);
        const layout = measureLogo(ctx.getImageData(0, 0, analysis.width, analysis.height).data, analysis.width, analysis.height);
        const output = document.createElement('canvas');
        output.width = circular ? 256 : Math.max(1, Math.round(layout.width / ratio));
        output.height = circular ? 256 : Math.max(1, Math.round(layout.height / ratio));
        const out = output.getContext('2d');
        if (!out) return;
        if (circular) {
          out.beginPath(); out.arc(128, 128, 128, 0, 2 * Math.PI); out.clip();
          out.fillStyle = layout.background; out.fillRect(0, 0, 256, 256);
        }
        // A rectangle is inscribed in the circle so its corners cannot be cropped.
        const scale = circular
          ? 256 / (layout.circular ? Math.max(layout.width, layout.height) : Math.hypot(layout.width, layout.height))
          : 1 / ratio;
        const w = layout.width * scale, h = layout.height * scale;
        out.drawImage(image, layout.x / ratio, layout.y / ratio, layout.width / ratio, layout.height / ratio,
          (output.width - w) / 2, (output.height - h) / 2, w, h);
        if (!cancelled) setPrepared({ src, result: output.toDataURL('image/png') });
      } catch {
        // External images without CORS permission remain contained, never stretched.
      }
    };
    image.src = src;
    return () => { cancelled = true; image.onload = null; };
  }, [src, circular]);
  return <img src={prepared?.src === src ? prepared.result : src} alt={alt} className={className} />;
}