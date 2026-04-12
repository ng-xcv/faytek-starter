import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, Settings as SettingsIcon, Users, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions, CanAccess } from '../../contexts/PermissionsContext';
import GeneralTab from './GeneralTab';
import UsersTab from './UsersTab';
import ProfilsTab from './ProfilsTab';

const TABS = [
  { key: 'general', label: 'Général', desc: 'Entreprise & thème', icon: SettingsIcon, perm: { module: 'settings', action: 'voirListe' } },
  { key: 'users', label: 'Utilisateurs', desc: 'Comptes & accès', icon: Users, perm: { module: 'users', action: 'voirListe' } },
  { key: 'profils', label: 'Profils & Permissions', desc: 'Rôles & autorisations', icon: Shield, perm: { module: 'profils', action: 'voirListe' } },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can, isAdmin } = usePermissions();

  const visibleTabs = TABS.filter((t) => isAdmin || can(t.perm.module, t.perm.action));
  const [active, setActive] = useState(visibleTabs[0]?.key || 'general');
  const activeTab = visibleTabs.find((t) => t.key === active);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-slate-100 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-20 right-0 w-lg h-128 rounded-full bg-secondary/10 blur-3xl" />

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-10 py-3 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <motion.button onClick={() => navigate('/')} whileHover={{ x: -2 }}
            className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/10 transition-all">
            <ArrowLeft size={18} />
          </motion.button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary-light shadow-lg shadow-primary/30 flex items-center justify-center">
              <SettingsIcon size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                Paramétrage
                <Sparkles size={12} className="text-secondary" />
              </h1>
              <p className="text-[10px] text-gray-500">Configuration, utilisateurs et profils d'accès</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/60 border border-white/80 backdrop-blur-sm">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-gray-500">{user.profil?.nom || 'Utilisateur'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white">
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
            </div>
          )}
          <motion.button onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-gray-500 hover:text-danger hover:bg-danger/10 transition-all" title="Déconnexion">
            <LogOut size={16} />
          </motion.button>
        </div>
      </motion.header>

      {/* Hero tabs */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {activeTab?.label}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{activeTab?.desc}</p>
          </div>
        </motion.div>

        {/* Segmented tabs */}
        <div className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-1.5 shadow-lg shadow-primary/5 flex gap-1 overflow-x-auto">
          {visibleTabs.map((t) => {
            const isActive = active === t.key;
            return (
              <button key={t.key} onClick={() => setActive(t.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex-1 justify-center min-w-max ${
                  isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>
                {isActive && (
                  <motion.div layoutId="activePill" transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute inset-0 rounded-xl bg-linear-to-br from-primary to-primary-light shadow-lg shadow-primary/30" />
                )}
                <span className="relative flex items-center gap-2">
                  <t.icon size={14} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-10">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {active === 'general' && <CanAccess module="settings" action="voirListe" fallback={<Forbidden />}><GeneralTab /></CanAccess>}
            {active === 'users' && <CanAccess module="users" action="voirListe" fallback={<Forbidden />}><UsersTab /></CanAccess>}
            {active === 'profils' && <CanAccess module="profils" action="voirListe" fallback={<Forbidden />}><ProfilsTab /></CanAccess>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 mb-3">
        <Shield size={28} className="text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-700">Accès refusé</p>
      <p className="text-xs mt-1 text-gray-500">Vous n'avez pas la permission d'accéder à cette section.</p>
    </div>
  );
}
