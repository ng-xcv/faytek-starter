import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CalendarClock, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap = {
  info: Bell,
  warning: AlertTriangle,
  meeting: CalendarClock,
  relance: RefreshCw,
};

const colorMap = {
  info: 'text-secondary',
  warning: 'text-secondary',
  meeting: 'text-secondary',
  relance: 'text-secondary',
};

export default function FlashTicker({ messages = [] }) {
  if (!messages.length) return null;

  // Double les messages pour un scroll infini sans trou
  const doubled = [...messages, ...messages];

  return (
    <div className="w-full overflow-hidden bg-white/60 backdrop-blur-md border-t border-gray-200/50 py-3">
      <motion.div
        className="flex items-center gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: messages.length * 6, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((msg, i) => {
          const Icon = iconMap[msg.type] || Bell;
          return (
            <div key={i} className="flex items-center gap-2 shrink-0 px-4">
              <Icon size={14} className={cn(colorMap[msg.type] || 'text-muted')} />
              <span className="text-sm font-medium text-gray-700">{msg.text}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
