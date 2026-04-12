import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const accents = {
  danger: { bar: 'bg-red-500', icon: 'text-red-500', pulse: 'bg-red-400' },
  warning: { bar: 'bg-amber-500', icon: 'text-amber-500', pulse: 'bg-amber-400' },
  info: { bar: 'bg-blue-500', icon: 'text-blue-500', pulse: 'bg-blue-400' },
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-500', pulse: 'bg-emerald-400' },
  primary: { bar: 'bg-indigo-500', icon: 'text-indigo-500', pulse: 'bg-indigo-400' },
  secondary: { bar: 'bg-lime-600', icon: 'text-lime-600', pulse: 'bg-lime-500' },
};

export default function KpiCard({ icon: Icon, label, value, trend, color = 'primary', onClick, delay = 0 }) {
  const a = accents[color] || accents.primary;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.08 + delay * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.96 }}
      className="group relative flex flex-row items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer bg-white shadow-sm hover:shadow-lg border border-gray-100 hover:border-gray-200/80 transition-all duration-300 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-2 bottom-2 w-0.75 rounded-full', a.bar)} />

      {/* Icon with subtle pulse ring on hover */}
      <div className="relative shrink-0">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200', a.icon)}>
          <Icon size={16} strokeWidth={2} />
        </div>
        <motion.div
          className={cn('absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20', a.pulse)}
          animate={{ scale: [1, 1.4, 1], opacity: [0, 0.15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-lg font-extrabold tracking-tight leading-none text-gray-900">
          {value}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400 whitespace-nowrap mt-0.5">
          {label}
        </span>
      </div>

      {/* Trend badge */}
      {trend && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + delay * 0.06, type: 'spring', stiffness: 400 }}
          className={cn(
            'absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-px rounded-full',
            trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}
        >
          {trend > 0 ? '+' : ''}{trend}%
        </motion.span>
      )}
    </motion.button>
  );
}
