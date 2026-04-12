import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X, UserPlus, Users, ShieldCheck, UserX } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { CanAccess, usePermissions } from '../../contexts/PermissionsContext';

export default function UsersTab() {
  const { can, isAdmin } = usePermissions();
  const [users, setUsers] = useState([]);
  const [profils, setProfils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProfil, setFilterProfil] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | user object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        axiosInstance.get('/api/user'),
        axiosInstance.get('/api/profil').catch(() => ({ data: { profils: [] } })),
      ]);
      setUsers(u.data.users || []);
      setProfils(p.data.profils || []);
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erreur de chargement' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let r = [...users];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((u) => u.nom?.toLowerCase().includes(s) || u.prenom?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    if (filterProfil) r = r.filter((u) => u.profil?._id === filterProfil);
    if (filterStatut !== '') r = r.filter((u) => u.actif === (filterStatut === 'true'));
    return r;
  }, [users, search, filterProfil, filterStatut]);

  const stats = useMemo(() => ({
    total: users.length,
    actifs: users.filter((u) => u.actif).length,
    admins: users.filter((u) => u.profil?.isAdmin).length,
    inactifs: users.filter((u) => !u.actif).length,
  }), [users]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/user/${deleteTarget._id}`);
      setMessage({ type: 'success', text: 'Utilisateur supprimé' });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erreur' });
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, icon: Users, grad: 'from-primary to-primary-light', glow: 'shadow-primary/20', text: 'text-primary' },
          { label: 'Actifs', value: stats.actifs, icon: ShieldCheck, grad: 'from-success to-emerald-400', glow: 'shadow-success/20', text: 'text-success' },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck, grad: 'from-warning to-amber-400', glow: 'shadow-warning/20', text: 'text-warning' },
          { label: 'Inactifs', value: stats.inactifs, icon: UserX, grad: 'from-danger to-rose-400', glow: 'shadow-danger/20', text: 'text-danger' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className={`relative overflow-hidden rounded-2xl p-4 bg-white border border-white shadow-lg ${s.glow} transition-shadow hover:shadow-xl`}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 bg-linear-to-br ${s.grad}" style={{}} />
            <div className="relative flex items-start justify-between">
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

      {/* Filtres + action */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-3 mb-4 shadow-sm flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none" />
        </div>
        <select value={filterProfil} onChange={(e) => setFilterProfil(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none bg-white">
          <option value="">Tous profils</option>
          {profils.map((p) => <option key={p._id} value={p._id}>{p.nom}</option>)}
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none bg-white">
          <option value="">Tous statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
        <div className="flex-1" />
        <CanAccess module="users" action="creer">
          <motion.button onClick={() => setEditing('new')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow">
            <Plus size={14} />Nouvel utilisateur
          </motion.button>
        </CanAccess>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-white ring-1 ring-gray-200/60 overflow-hidden shadow-lg shadow-gray-200/50">
        {loading ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserPlus size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Utilisateur', 'Email', 'Profil', 'Statut', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id} className={`${i % 2 ? 'bg-gray-50/40' : ''} hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary-light text-white text-[11px] font-bold flex items-center justify-center">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div className="font-semibold text-gray-900 text-xs">{u.prenom} {u.nom}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">{u.profil?.nom || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${u.actif ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-end">
                        {(isAdmin || can('users', 'modifier')) && (
                          <button onClick={() => setEditing(u)} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors" aria-label="Modifier">
                            <Pencil size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors" aria-label="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer form */}
      <AnimatePresence>
        {editing && (
          <UserFormDrawer
            user={editing === 'new' ? null : editing}
            profils={profils}
            onClose={() => setEditing(null)}
            onSaved={(msg) => { setMessage({ type: 'success', text: msg }); fetchAll(); setEditing(null); }}
            onError={(msg) => setMessage({ type: 'error', text: msg })}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
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
              <p className="text-sm text-gray-600 mb-5">Supprimer <strong>{deleteTarget.prenom} {deleteTarget.nom}</strong> ? Action irréversible.</p>
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
function UserFormDrawer({ user, profils, onClose, onSaved, onError }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '',
    password: '', profil: user?.profil?._id || '', actif: user?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await axiosInstance.put(`/api/user/${user._id}`, payload);
        onSaved('Utilisateur modifié');
      } else {
        await axiosInstance.post('/api/user', payload);
        onSaved('Utilisateur créé');
      }
    } catch (err) {
      onError(err?.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
        className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-linear-to-r from-primary to-primary-light text-white px-6 py-4 flex items-center justify-between shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight">{isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h2>
              <p className="text-[11px] text-white/80">Renseignez les informations du compte</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} required />
            <Field label="Nom *" name="nom" value={form.nom} onChange={handleChange} required />
          </div>
          <Field label="Email *" name="email" value={form.email} onChange={handleChange} type="email" required />
          <Field label={isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'} name="password" value={form.password} onChange={handleChange} type="password" required={!isEdit} />
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1 block">Profil *</label>
            <select name="profil" value={form.profil} onChange={handleChange} required
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none bg-white">
              <option value="">— Sélectionner —</option>
              {profils.map((p) => <option key={p._id} value={p._id}>{p.nom}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} className="w-4 h-4 accent-primary" />
            <span className="font-medium text-gray-700">{form.actif ? 'Compte actif' : 'Compte inactif'}</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100">Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-60">
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-[11px] font-medium text-gray-500 mb-1 block">{label}</label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} required={required}
        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none bg-white" />
    </div>
  );
}
