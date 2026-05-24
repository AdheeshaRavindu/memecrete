import { create } from 'zustand';
import type { SpinMemeResponse } from '@/shared/types';
import { drawMemeCanvas } from '@/shared/render';
import { generateMemeResult } from '@/shared/engine';

interface SpinState {
  latest: SpinMemeResponse | null;
  loading: boolean;
  error: string | null;
  spin: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function renderLocalSpin(styleHint = 'concrete'): Promise<SpinMemeResponse> {
  const result = await generateMemeResult({ recent: [], styleHint });

  if (typeof document === 'undefined') {
    throw new Error('Local rendering is not available in this environment');
  }

  const canvas = document.createElement('canvas');
  const rendered = drawMemeCanvas(canvas, result.render, result.caption);

  return {
    memeUrl: rendered.dataUrl,
    caption: result.caption,
    xPost: result.xPost,
    template: result.template.name,
  };
}

export const useSpinStore = create<SpinState>((set) => ({
  latest: null,
  loading: false,
  error: null,
  spin: async () => {
    set({ loading: true, error: null });

    try {
      if (API_BASE) {
        try {
          const remote = await fetchJson<SpinMemeResponse>(`${API_BASE}/api/spin`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
          });
          set({ latest: remote, loading: false });
          return;
        } catch {
          // Fall through to local generation when the worker is absent or returns 405/500.
        }
      }

      const local = await renderLocalSpin();
      set({ latest: local, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Spin failed' });
    }
  },
}));
