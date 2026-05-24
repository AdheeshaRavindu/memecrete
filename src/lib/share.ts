export async function copyText(text: string) {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(text);
}

export async function openXIntent(text: string) {
  if (!text) {
    return;
  }

  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function downloadImage(url: string, filename: string) {
  if (!url) {
    return;
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);

    link.download = filename;
    link.href = objectUrl;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function safeDownloadCanvas(canvas: HTMLCanvasElement | null, filename: string) {
  if (!canvas) {
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.download = filename;
    link.href = url;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, 'image/jpeg', 0.92);
}
