export async function readAndCompressImageFile(
  file: File,
  maxDimension = 1080,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const rawResult = typeof reader.result === 'string' ? reader.result : '';
      if (!rawResult) {
        reject(new Error('Empty image data.'));
        return;
      }

      // Preserve SVG and animated GIF directly
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(rawResult);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawResult);
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(rawResult);
          return;
        }

        // If already small enough, return directly
        if (w <= maxDimension && h <= maxDimension && rawResult.length < 350_000) {
          resolve(rawResult);
          return;
        }

        const scale = Math.min(1, maxDimension / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawResult);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputMime, quality));
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  });
}
