export type LogoLayout = {
  x: number; y: number; width: number; height: number;
  circular: boolean; background: string;
};

/** Ignore transparent/near-white upload margins, never pixels belonging to artwork. */
export function measureLogo(data: Uint8ClampedArray, width: number, height: number): LogoLayout {
  let left = width, top = height, right = -1, bottom = -1;
  const colors = new Map<string, { count: number; r: number; g: number; b: number }>();
  const visible = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return data[i + 3] > 24 && Math.min(data[i], data[i + 1], data[i + 2]) < 245;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visible(x, y)) continue;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const color = colors.get(key);
      if (color) { color.count++; color.r += r; color.g += g; color.b += b; }
      else colors.set(key, { count: 1, r, g, b });
    }
  }
  if (right < left) return { x: 0, y: 0, width, height, circular: false, background: 'transparent' };
  const w = right - left + 1, h = bottom - top + 1;
  // Circular artwork has empty corners and a continuous occupied rim.
  const corners = [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]];
  const sample = (x: number, y: number) => visible(Math.round(left + (w - 1) * x), Math.round(top + (h - 1) * y));
  let rim = 0;
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI / 16;
    if (sample(0.5 + 0.44 * Math.cos(angle), 0.5 + 0.44 * Math.sin(angle))) rim++;
  }
  const circular = Math.abs(w / h - 1) < 0.08 && corners.every(([x, y]) => !sample(x, y)) && rim >= 29;
  const dominant = [...colors.values()].sort((a, b) => b.count - a.count)[0];
  // This color belongs to the uploaded image, not the application theme.
  const background = dominant ? `rgb(${Math.round(dominant.r / dominant.count)},${Math.round(dominant.g / dominant.count)},${Math.round(dominant.b / dominant.count)})` : 'transparent';
  return { x: left, y: top, width: w, height: h, circular, background };
}