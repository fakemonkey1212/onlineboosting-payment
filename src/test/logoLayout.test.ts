import { describe, expect, it } from 'vitest';
import { measureLogo } from '@/lib/logoLayout';

function pixels(width: number, height: number, painted: (x: number, y: number) => boolean) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const color = painted(x, y) ? [20, 100, 180, 255] : [255, 255, 255, 255];
    data.set(color, i);
  }
  return data;
}

describe('merchant logo sizing', () => {
  it('removes upload whitespace and recognizes a circular logo', () => {
    const layout = measureLogo(pixels(100, 100, (x, y) => Math.hypot(x - 50, y - 50) <= 30), 100, 100);
    expect(layout).toMatchObject({ x: 20, y: 20, width: 61, height: 61, circular: true, background: 'rgb(20,100,180)' });
  });
  it('keeps full wide artwork inside the circle without changing its proportions', () => {
    const layout = measureLogo(pixels(100, 100, (x, y) => x >= 10 && x < 90 && y >= 40 && y < 60), 100, 100);
    expect(layout).toMatchObject({ x: 10, y: 40, width: 80, height: 20, circular: false });
    const scale = 256 / Math.hypot(layout.width, layout.height);
    expect(Math.hypot(layout.width * scale, layout.height * scale)).toBeCloseTo(256);
    expect(layout.width * scale / (layout.height * scale)).toBe(4);
  });
  it('handles blank uploads safely', () => {
    expect(measureLogo(pixels(20, 20, () => false), 20, 20)).toMatchObject({ width: 20, height: 20, circular: false });
  });
});