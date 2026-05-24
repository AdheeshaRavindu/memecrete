import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { copyText, downloadImage, openXIntent } from '@/lib/share';
import { useSpinStore } from '@/store/useSpinStore';

export function SpincreteApp() {
  const { latest, loading, error, spin } = useSpinStore();
  const [copied, setCopied] = useState(false);

  const fileName = useMemo(() => {
    const slug = latest?.template.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'meme';
    return `spincrete-${slug}.jpg`;
  }, [latest?.template]);

  async function handleCopyCaption() {
    if (!latest?.caption) {
      return;
    }

    await copyText(latest.caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  return (
    <div className="min-h-screen bg-[#070908] text-[#f4f0e7]">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-3 py-3 sm:px-5 sm:py-5">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#86efac]">Spincrete</p>
            <h1 className="text-lg font-black tracking-normal sm:text-2xl">Concrete memes</h1>
          </div>
          <span className="border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            Moai mode
          </span>
        </header>

        <section className="border border-[#86efac]/45 bg-[#0d1110] p-3 shadow-xl shadow-[#86efac]/10 sm:p-4">
          <button
            type="button"
            onClick={() => void spin()}
            disabled={loading}
            className="w-full border border-[#86efac] bg-[#86efac] px-5 py-5 text-center text-3xl font-black uppercase tracking-normal text-[#07100b] shadow-[0_0_28px_rgba(134,239,172,0.24)] transition hover:bg-[#bbf7d0] active:translate-y-0.5 disabled:cursor-wait disabled:border-white/15 disabled:bg-white/10 disabled:text-white/50 sm:text-4xl"
          >
            {loading ? 'Consulting the ancient Moai...' : 'SPIN MEME'}
          </button>
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Positive Concrete. CT-native. No corporate slop.
          </p>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 border border-[#f87171]/30 bg-[#2a1010] p-3 text-sm font-semibold text-[#fecaca]"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </section>

        <section className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
          <motion.div
            layout
            className="overflow-hidden border border-white/10 bg-[#0b0f0e]"
            initial={false}
            animate={{ opacity: loading && !latest ? 0.82 : 1 }}
          >
            {latest ? (
              <img src={latest.memeUrl} alt={latest.caption} className="mx-auto max-h-[62vh] w-full bg-black object-contain" />
            ) : (
              <div className="flex aspect-[4/3] min-h-[260px] items-center justify-center bg-[linear-gradient(135deg,#0b0f0e_0%,#101713_55%,#11100b_100%)] p-6 text-center">
                <p className="max-w-xs text-sm font-medium leading-relaxed text-white/55">
                  Hit spin. Concrete gets the hero edit, CT gets roasted.
                </p>
              </div>
            )}
          </motion.div>

          <aside className="flex flex-col gap-3">
            <section className="border border-white/10 bg-[#101312] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Template</p>
              <p className="mt-1 text-base font-black text-white">{latest?.template ?? 'Ready'}</p>
            </section>

            <section className="border border-white/10 bg-[#101312] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#67e8f9]">Caption</p>
              <p className="mt-2 min-h-16 text-sm font-semibold leading-snug text-[#f4f0e7]">
                {latest?.caption ?? 'Your caption lands here.'}
              </p>
            </section>

            <section className="border border-white/10 bg-[#101312] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#facc15]">X Post</p>
              <p className="mt-2 min-h-20 whitespace-pre-wrap text-sm font-medium leading-relaxed text-white/75">
                {latest?.xPost ?? 'Your X post lands here.'}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void spin()}
                disabled={loading}
                className="border border-white/10 bg-white/[0.06] px-3 py-3 text-xs font-bold uppercase tracking-normal text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                Spin Again
              </button>
              <button
                type="button"
                onClick={() => latest && void downloadImage(latest.memeUrl, fileName)}
                disabled={!latest}
                className="border border-white/10 bg-white/[0.06] px-3 py-3 text-xs font-bold uppercase tracking-normal text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => void handleCopyCaption()}
                disabled={!latest}
                className="border border-white/10 bg-white/[0.06] px-3 py-3 text-xs font-bold uppercase tracking-normal text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => latest && void openXIntent(latest.xPost)}
                disabled={!latest}
                className="border border-[#67e8f9]/50 bg-[#082f36] px-3 py-3 text-xs font-bold uppercase tracking-normal text-[#cffafe] transition hover:bg-[#0e4752] disabled:border-white/10 disabled:bg-white/[0.06] disabled:text-white/40"
              >
                Share X
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
