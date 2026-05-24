interface StatPillProps {
  label: string;
  value: string;
  tone: 'mint' | 'amber' | 'slate';
}

const toneClasses: Record<StatPillProps['tone'], string> = {
  mint: 'bg-[#1040C0] text-white',
  amber: 'bg-[#F0C020] text-[#121212]',
  slate: 'bg-[#F0F0F0] text-[#121212]',
};

export function StatPill({ label, value, tone }: StatPillProps) {
  return (
    <div className={`bauhaus-card px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-black uppercase tracking-tight">{value}</p>
    </div>
  );
}