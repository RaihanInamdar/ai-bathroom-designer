export interface ProcessedImage {
  file: File;
  base64: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          file,
          base64,
          width: img.width,
          height: img.height,
          aspectRatio: Number((img.width / img.height).toFixed(2))
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for dimension processing.'));
      img.src = base64;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
