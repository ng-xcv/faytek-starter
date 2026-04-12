import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const iconColors = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-emerald-500',
  primary: 'text-indigo-500',
  secondary: 'text-lime-600',
};

function KpiItem({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay * 0.05, duration: 0.35 }}
      className="flex items-center gap-1.5 cursor-default"
    >
      <div className={cn('shrink-0', iconColors[color])}>
        <Icon size={13} strokeWidth={2.2} />
      </div>
      <span className="text-sm font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

export default function KpiBanner({ kpis = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto flex items-center justify-evenly px-3 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100"
    >
      {kpis.map((kpi, i) => (
        <div key={kpi.label} className={cn('flex items-center gap-4', i >= 3 && 'hidden sm:flex')}>
          {i > 0 && <div className={cn('w-px h-4 bg-gray-200', i === 3 && 'hidden sm:block')} />}
          <KpiItem
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            delay={i}
          />
        </div>
      ))}
    </motion.div>
  );
}
