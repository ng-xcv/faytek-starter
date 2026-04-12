import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, ShieldCheck, ShieldAlert, Shield, AlertCircle, LayoutGrid, List, Users, Key } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { MODULES, ACTIONS, MODULE_LABELS, ACTION_LABELS } from '../../constants/permissions';
import { CanAccess, usePermissions } from '../../contexts/PermissionsContext';

const buildDefaultPermissions = (profil = null) =>
  MODULES.reduce((acc, mod) => ({
    ...acc,
    [mod]: ACTIONS.reduce((a, action) => ({ ...a, [action]: profil?.permissions?.[mod]?.[action] ?? false }), {}),
  }), {});

export default function ProfilsTab() {
  const { isAdmin } = usePermissions();
  const [profils, setProfils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState(null);
  const [view, setView] = useState('cards'); // 'cards' (défaut) | 'table'

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/profil');
      setProfils(data.profils || []);
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const stats = useMemo(() => ({
    total: profils.length,
    admins: profils.filter((p) => p.isAdmin).length,
    actifs: profils.filter((p) => p.actif).length,
  }), [profils]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/profil/${deleteTarget._id}`);
      setMessage({ type: 'success', text: 'Profil supprimé' });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erreur' });
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
          {message.text}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total profils', value: stats.total, icon: Shield, grad: 'from-primary to-primary-light', glow: 'shadow-primary/20', text: 'text-primary' },
          { label: 'Administrateurs', value: stats.admins, icon: ShieldAlert, grad: 'from-danger to-rose-400', glow: 'shadow-danger/20', text: 'text-danger' },
          { label: 'Actifs', value: stats.actifs, icon: ShieldCheck, grad: 'from-success to-emerald-400', glow: 'shadow-success/20', text: 'text-success' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className={`relative overflow-hidden rounded-2xl p-4 bg-white border border-white shadow-lg ${s.glow} transition-shadow hover:shadow-xl`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-3xl font-black tracking-tight ${s.text}`}>{s.value}</p>
                <p className="text-[11px] text-gray-500 font-semibold mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${s.grad} shadow-md flex items-center justify-center`}>
                <s.icon size={18} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header + toggle vue + bouton */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-xs text-gray-600">Gérez les rôles et leurs permissions par module.</p>
        <div className="flex items-center gap-2">
          {/* Toggle cards/table */}
          <div className="inline-flex items-center bg-white/80 border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setView('cards')} aria-label="Vue cartes"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                view === 'cards' ? 'bg-linear-to-br from-primary to-primary-light text-white shadow-sm shadow-primary/30' : 'text-gray-500 hover:text-gray-800'
              }`}>
              <LayoutGrid size={13} /> Cartes
            </button>
            <button onClick={() => setView('table')} aria-label="Vue tableau"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                view === 'table' ? 'bg-linear-to-br from-primary to-primary-light text-white shadow-sm shadow-primary/30' : 'text-gray-500 hover:text-gray-800'
              }`}>
              <List size={13} /> Tableau
            </button>
          </div>
          <CanAccess module="profils" action="creer">
            <motion.button onClick={() => setEditing('new')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-br from-primary to-primary-light text-white text-xs font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow">
              <Plus size={14} />Nouveau profil
            </motion.button>
          </CanAccess>
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="py-16 flex justify-center bg-white rounded-2xl ring-1 ring-gray-200/60 shadow-sm">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : profils.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl ring-1 ring-gray-200/60 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 mb-3">
            <Shield size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-700">Aucun profil</p>
          <p className="text-xs text-gray-500 mt-1">Créez votre premier profil pour définir des accès.</p>
        </div>
      ) : view === 'cards' ? (
        /* Vue cartes */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profils.map((p, i) => {
            const permCount = p.isAdmin ? MODULES.length * ACTIONS.length : MODULES.reduce((sum, m) => sum + ACTIONS.filter((a) => p.permissions?.[m]?.[a]).length, 0);
            const totalPerms = MODULES.length * ACTIONS.length;
            const pct = Math.round((permCount / totalPerms) * 100);
            const modulesActifs = p.isAdmin ? MODULES.length : MODULES.filter((m) => ACTIONS.some((a) => p.permissions?.[m]?.[a])).length;

            return (
              <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="group relative overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200/60 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-primary/10 transition-all">
                {/* Bandeau haut */}
                <div className={`h-1.5 bg-linear-to-r ${p.isAdmin ? 'from-danger to-rose-400' : p.actif ? 'from-primary to-primary-light' : 'from-gray-300 to-gray-400'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
                        p.isAdmin ? 'bg-linear-to-br from-danger to-rose-400 shadow-danger/30' : 'bg-linear-to-br from-primary to-primary-light shadow-primary/30'
                      }`}>
                        {p.isAdmin ? <ShieldAlert size={20} className="text-white" /> : <Shield size={20} className="text-white" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 tracking-tight">{p.nom}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.isAdmin && <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-danger/10 text-danger uppercase tracking-wide">Admin</span>}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${p.actif ? 'bg-success/10 text-success' : 'bg-gray-200 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.actif ? 'bg-success' : 'bg-gray-400'}`} />
                            {p.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors" aria-label="Modifier"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors" aria-label="Supprimer"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem] mb-4">{p.description || 'Aucune description'}</p>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-center gap-1 text-primary mb-0.5"><Users size={12} /></div>
                      <p className="text-lg font-black text-gray-900 leading-none">{p.usersCount ?? 0}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Users</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-center gap-1 text-primary mb-0.5"><LayoutGrid size={12} /></div>
                      <p className="text-lg font-black text-gray-900 leading-none">{modulesActifs}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Modules</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-center gap-1 text-primary mb-0.5"><Key size={12} /></div>
                      <p className="text-lg font-black text-gray-900 leading-none">{permCount}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Perms</p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Couverture</p>
                      <p className={`text-[10px] font-black ${p.isAdmin ? 'text-danger' : pct > 66 ? 'text-success' : pct > 33 ? 'text-warning' : 'text-gray-500'}`}>{pct}%</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.1 + i * 0.04, duration: 0.6 }}
                        className={`h-full rounded-full bg-linear-to-r ${
                          p.isAdmin ? 'from-danger to-rose-400' : pct > 66 ? 'from-success to-emerald-400' : pct > 33 ? 'from-warning to-amber-400' : 'from-gray-300 to-gray-400'
                        }`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Vue tableau */
        <div className="bg-white rounded-2xl border border-white ring-1 ring-gray-200/60 overflow-hidden shadow-lg shadow-gray-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Nom', 'Description', 'Type', 'Statut', 'Utilisateurs', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profils.map((p, i) => (
                  <tr key={p._id} className={`${i % 2 ? 'bg-gray-50/40' : ''} hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0`}>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{p.nom}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs truncate">{p.description || '—'}</td>
                    <td className="px-4 py-2.5">
                      {p.isAdmin ? <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-danger/10 text-danger">Admin</span>
                        : <span className="text-[11px] text-gray-500">Standard</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${p.actif ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{p.usersCount ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-end">
                        {isAdmin && (
                          <>
                            <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20" aria-label="Modifier"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20" aria-label="Supprimer"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {editing && (
          <ProfilFormDrawer
            profil={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(msg) => { setMessage({ type: 'success', text: msg }); fetchAll(); setEditing(null); }}
            onError={(msg) => setMessage({ type: 'error', text: msg })}
          />
        )}
      </AnimatePresence>

      {/* Delete */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center"><Trash2 size={18} className="text-danger" /></div>
                <h3 className="font-bold text-gray-900">Confirmer la suppression</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">Supprimer le profil <strong>{deleteTarget.nom}</strong> ?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 text-xs font-bold text-white bg-danger rounded-lg hover:bg-danger/90 shadow-sm">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Drawer form ─────────────────────────────────────────────────────────────
function ProfilFormDrawer({ profil, onClose, onSaved, onError }) {
  const isEdit = Boolean(profil);
  const [form, setForm] = useState({
    nom: profil?.nom || '',
    description: profil?.description || '',
    isAdmin: profil?.isAdmin ?? false,
    actif: profil?.actif ?? true,
    permissions: buildDefaultPermissions(profil),
  });
  const [saving, setSaving] = useState(false);

  const togglePerm = (mod, action) =>
    setForm((p) => ({
      ...p,
      permissions: { ...p.permissions, [mod]: { ...p.permissions[mod], [action]: !p.permissions[mod][action] } },
    }));

  const toggleRow = (mod) => {
    const allOn = ACTIONS.every((a) => form.permissions[mod][a]);
    setForm((p) => ({
      ...p,
      permissions: { ...p.permissions, [mod]: ACTIONS.reduce((acc, a) => ({ ...acc, [a]: !allOn }), {}) },
    }));
  };

  const toggleCol = (action) => {
    const allOn = MODULES.every((m) => form.permissions[m][action]);
    setForm((p) => ({
      ...p,
      permissions: MODULES.reduce((acc, m) => ({ ...acc, [m]: { ...p.permissions[m], [action]: !allOn } }), {}),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/api/profil/${profil._id}`, form);
        onSaved('Profil modifié');
      } else {
        await axiosInstance.post('/api/profil', form);
        onSaved('Profil créé');
      }
    } catch (err) {
      onError(err?.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
        className="h-full w-full max-w-3xl bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-linear-to-r from-primary to-primary-light text-white px-6 py-4 flex items-center justify-between shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight">{isEdit ? 'Modifier le profil' : 'Nouveau profil'}</h2>
              <p className="text-[11px] text-white/80">Définissez les autorisations par module</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200/60 p-4">
            <h3 className="text-xs font-bold text-gray-900 mb-3">Informations générales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Nom *</label>
                <input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Description</label>
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm((p) => ({ ...p, isAdmin: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="font-medium text-gray-700">Administrateur (accès total)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm((p) => ({ ...p, actif: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="font-medium text-gray-700">{form.actif ? 'Actif' : 'Inactif'}</span>
              </label>
            </div>
            {form.isAdmin && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-warning/10 rounded-lg text-warning text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Ce profil a accès à tout — toutes les permissions ci-dessous sont ignorées.</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  Matrice des permissions
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Cliquez sur un titre de ligne/colonne pour tout basculer</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200/80">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50 to-slate-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-bold text-gray-700 sticky left-0 bg-linear-to-r from-gray-50 to-slate-100 z-10 min-w-[140px]">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[10px] tracking-wider">
                        <button type="button" onClick={() => toggleCol(a)} disabled={form.isAdmin}
                          className="hover:text-primary disabled:opacity-50 transition-colors whitespace-nowrap">
                          {ACTION_LABELS[a]}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod, i) => (
                    <tr key={mod} className={`${i % 2 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0`}>
                      <td className={`px-3 py-2 font-semibold text-gray-800 sticky left-0 ${i % 2 ? 'bg-gray-50/50' : 'bg-white'} z-10`}>
                        <button type="button" onClick={() => toggleRow(mod)} disabled={form.isAdmin}
                          className="hover:text-primary text-left disabled:opacity-50 transition-colors">
                          {MODULE_LABELS[mod]}
                        </button>
                      </td>
                      {ACTIONS.map((action) => {
                        const checked = form.isAdmin ? true : form.permissions[mod][action];
                        return (
                          <td key={action} className="px-2 py-2 text-center">
                            <button type="button" onClick={() => togglePerm(mod, action)} disabled={form.isAdmin}
                              className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${
                                checked
                                  ? 'bg-linear-to-br from-primary to-primary-light shadow-sm shadow-primary/30 ring-1 ring-primary/30'
                                  : 'bg-gray-100 hover:bg-gray-200 ring-1 ring-gray-200'
                              } ${form.isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              aria-label={`${MODULE_LABELS[mod]} - ${ACTION_LABELS[action]}`}>
                              {checked && (
                                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-white py-3 border-t border-gray-200 -mx-5 px-5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100">Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-60">
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le profil'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
