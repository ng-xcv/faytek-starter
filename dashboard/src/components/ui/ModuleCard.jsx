import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const moduleThemes = {
  buyflow: {
    gradient: 'from-[#1B4B8A] to-[#2a6bc4]',
    iconBg: 'bg-white/15',
    shadow: 'shadow-[#1B4B8A]/20 hover:shadow-[#1B4B8A]/35',
    accent: '#5c9bfc',
  },
  actionplan: {
    gradient: 'from-[#0d6649] to-[#15a371]',
    iconBg: 'bg-white/15',
    shadow: 'shadow-[#0d6649]/20 hover:shadow-[#0d6649]/35',
    accent: '#34d399',
  },
  missionflow: {
    gradient: 'from-[#7c3aed] to-[#a78bfa]',
    iconBg: 'bg-white/15',
    shadow: 'shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/35',
    accent: '#c4b5fd',
  },
  itsupport: {
    gradient: 'from-[#b45309] to-[#f59e0b]',
    iconBg: 'bg-white/15',
    shadow: 'shadow-[#b45309]/20 hover:shadow-[#b45309]/35',
    accent: '#fcd34d',
  },
  parametrage: {
    gradient: 'from-[#475569] to-[#64748b]',
    iconBg: 'bg-white/15',
    shadow: 'shadow-[#475569]/20 hover:shadow-[#475569]/35',
    accent: '#94a3b8',
  },
};

export default function ModuleCard({ id, icon: Icon, title, subtitle, onClick, delay = 0 }) {
  const t = moduleThemes[id] || moduleThemes.buyflow;

  return (
    <motion.button
      onClick={() => onClick(id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.25 + delay * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -6,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'group relative flex flex-col w-full rounded-2xl p-5 text-left overflow-hidden cursor-pointer',
        'bg-linear-to-br shadow-lg hover:shadow-xl transition-all duration-400',
        t.gradient, t.shadow
      )}
    >
      {/* Blurred circle deco */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-700"
        style={{ background: t.accent }}
      />

      {/* Floating circle */}
      <motion.div
        className="absolute bottom-6 right-4 w-10 h-10 rounded-full opacity-10"
        style={{ background: t.accent }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Icon */}
      <div className={cn('relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-3', t.iconBg)}>
        <Icon size={20} className="text-white" strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-white mb-0.5 tracking-tight">{title}</h3>
        <p className="text-[11px] text-white/55 leading-snug">{subtitle}</p>
      </div>

      {/* Arrow CTA */}
      <div className="relative z-10 mt-3 flex items-center gap-1.5 text-white/35 group-hover:text-white/80 transition-colors duration-300">
        <span className="text-[10px] font-medium uppercase tracking-wider">Ouvrir</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
      </div>

      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-5 right-5 h-px bg-linear-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.button>
  );
}
