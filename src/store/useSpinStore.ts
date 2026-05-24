import { create } from 'zustand';
import type { SpinMemeResponse } from '@/shared/types';

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

export const useSpinStore = create<SpinState>((set) => ({
  latest: null,
  loading: false,
  error: null,
  spin: async () => {
    set({ loading: true, error: null });

    try {
      const remote = await fetchJson<SpinMemeResponse>(`${API_BASE}/api/spin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      set({ latest: remote, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Spin failed' });
    }
  },
}));
