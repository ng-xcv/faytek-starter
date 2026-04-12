import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';

export default function LoadingScreen() {
  const { logo, companyName, slogan } = useSettings();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Orbs de fond */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/12 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particules flottantes */}
      {[
        { top: '20%', left: '15%', dur: 6 },
        { top: '30%', left: '82%', dur: 7 },
        { top: '70%', left: '12%', dur: 8 },
        { top: '78%', left: '85%', dur: 9 },
        { top: '50%', left: '92%', dur: 7.5 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
          style={{ top: p.top, left: p.left }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo + anneaux pulsants */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Anneau rotatif conic */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, var(--color-primary) 90deg, transparent 180deg, var(--color-secondary) 270deg, transparent 360deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Anneaux ripple */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-secondary/30"
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.6,
            }}
          />

          {/* Carte logo centrale */}
          <motion.div
            className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 overflow-hidden ${
              logo ? 'bg-white p-2.5' : 'bg-linear-to-br from-primary to-primary-dark'
            }`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {logo ? (
              <img
                src={logo}
                alt={companyName || 'Logo'}
                className="w-full h-full object-contain"
              />
            ) : (
              <motion.span
                className="text-3xl font-bold text-white"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {companyName?.[0] || 'F'}
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Nom société */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-primary tracking-tight">
            {companyName || 'Faytek Solution'}
          </h2>
          {slogan && (
            <p className="text-[11px] text-slate-500 mt-0.5">{slogan}</p>
          )}
        </motion.div>

        {/* Barre de progression animée */}
        <div className="w-40 h-1 rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full w-1/3 rounded-full bg-linear-to-r from-primary via-secondary to-primary"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Points de chargement */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/50"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
