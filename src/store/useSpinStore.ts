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

function isLocalHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function resolveRemoteBase() {
  if (API_BASE) {
    return API_BASE;
  }

  if (typeof window === 'undefined' || isLocalHost()) {
    return '';
  }

  return window.location.origin.replace(/\/$/, '');
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the status-only message when the body is not JSON.
    }

    throw new Error(message);
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
      const remoteBase = resolveRemoteBase();

      if (remoteBase) {
        try {
          const remote = await fetchJson<SpinMemeResponse>(`${remoteBase}/api/spin`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
          });
          set({ latest: remote, loading: false });
          return;
        } catch {
          const local = await renderLocalSpin();
          set({ latest: local, loading: false });
          return;
        }
      }

      const local = await renderLocalSpin();
      set({ latest: local, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Spin failed' });
    }
  },
}));
