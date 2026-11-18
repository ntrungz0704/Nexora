import type { CardTone } from '../types';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  neutral: 'border-slate-800 bg-slate-900/70 text-slate-100',
  success: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  warning: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  danger: 'border-rose-500/40 bg-rose-950/30 text-rose-200',
};

export function StatusCard({ title, value, subtitle, tone = 'neutral' }: StatusCardProps) {
  return (
    <div className={`rounded-xl border p-5 transition ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
