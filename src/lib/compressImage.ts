/** Shrinks an uploaded logo so it downloads instantly (keeps transparency). */
export const compressImageFile = (file: File, maxSize = 320): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result || "");
      if (file.type === "image/svg+xml" || file.type === "image/gif") return resolve(src);
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL("image/webp", 0.9);
        resolve(out.startsWith("data:image/webp") && out.length < src.length ? out : src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
