import { motion } from 'framer-motion';
import type { TrendingTemplate } from '@/shared/types';

interface TrendListProps {
  trending: TrendingTemplate[];
}

export function TrendList({ trending }: TrendListProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="bauhaus-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#121212]/70">Trending</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight">Most generated today</h3>
        </div>
        <span className="bauhaus-badge px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]">
          D1
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {trending.length ? (
          trending.map((item, index) => (
            <div key={item.templateId} className="bauhaus-panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black uppercase tracking-tight">
                    {index + 1}. {item.templateName}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#121212]/70">{item.family}</p>
                </div>
                <div className="text-right text-xs font-bold uppercase tracking-[0.18em] text-[#121212]">
                  <p>{item.generationCount} spins</p>
                  <p>{item.avgScore} avg score</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bauhaus-panel p-6 text-sm font-medium leading-relaxed text-[#121212]/80">
            Spin a few memes and the daily leaderboard will populate here.
          </div>
        )}
      </div>
    </motion.aside>
  );
}