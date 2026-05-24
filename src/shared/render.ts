import type { MemeRenderSpec, RenderBlock } from './types';

export interface CanvasDrawResult {
  dataUrl: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function splitLines(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawBlock(ctx: CanvasRenderingContext2D, block: RenderBlock, plan: MemeRenderSpec) {
  const x = block.x * plan.width;
  const y = block.y * plan.height;
  const w = block.w * plan.width;
  const h = block.h * plan.height;
  const radius = block.radius ?? Math.min(w, h) * 0.1;

  if (block.kind === 'panel') {
    ctx.fillStyle = block.color ?? 'rgba(255,255,255,0.06)';
    roundRect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();
    return;
  }

  const text = block.text ?? '';
  if (!text) {
    return;
  }

  ctx.textAlign = block.align ?? 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(24, Math.round(plan.width * (block.fontScale ?? 0.065)));
  ctx.font = `800 ${fontSize}px Sora, sans-serif`;
  ctx.fillStyle = block.color ?? plan.template.palette.text;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';

  const maxChars = Math.max(12, Math.floor((block.w * plan.width) / (fontSize * 0.56)) * 2);
  const lines = splitLines(text, maxChars).slice(0, 4);
  const lineHeight = fontSize * 1.05;
  const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    ctx.strokeText(line, x + w / 2, lineY);
    ctx.fillText(line, x + w / 2, lineY);
  });
}

export function drawMemeCanvas(canvas: HTMLCanvasElement, plan: MemeRenderSpec, caption: string): CanvasDrawResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '' };
  }

  canvas.width = plan.width;
  canvas.height = plan.height;

  const gradient = ctx.createLinearGradient(0, 0, plan.width, plan.height);
  gradient.addColorStop(0, plan.template.palette.surface);
  gradient.addColorStop(1, plan.template.palette.edge);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, plan.width, plan.height);

  const halo = ctx.createRadialGradient(plan.width * 0.5, plan.height * 0.22, plan.width * 0.12, plan.width * 0.5, plan.height * 0.5, plan.width * 0.65);
  halo.addColorStop(0, `${plan.template.palette.glow}55`);
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, plan.width, plan.height);

  for (let index = 0; index < 150; index += 1) {
    const x = ((index * 97) % plan.width) + (index % 7) * 4;
    const y = ((index * 53) % plan.height) + (index % 5) * 3;
    ctx.fillStyle = `rgba(255,255,255,${index % 11 === 0 ? 0.1 : 0.03})`;
    ctx.fillRect(x % plan.width, y % plan.height, 2, 2);
  }

  const cardInset = plan.width * 0.06;
  roundRect(ctx, cardInset, cardInset, plan.width - cardInset * 2, plan.height - cardInset * 2, 42);
  ctx.fillStyle = 'rgba(4, 6, 10, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 4;
  ctx.stroke();

  plan.blocks.forEach((block) => drawBlock(ctx, block, plan));

  ctx.fillStyle = plan.template.palette.accent;
  ctx.font = '700 28px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(plan.title.toUpperCase(), cardInset + 28, plan.height - 34);

  ctx.font = '500 22px IBM Plex Mono, monospace';
  ctx.fillStyle = 'rgba(243, 239, 232, 0.88)';
  ctx.fillText(caption.length > 74 ? `${caption.slice(0, 74)}…` : caption, cardInset + 28, plan.height - 66);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
  };
}