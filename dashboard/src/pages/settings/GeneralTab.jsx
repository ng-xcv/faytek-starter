import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Palette, Phone, Upload, Save, Image } from 'lucide-react';
import axiosInstance from '../../utils/axios';

export default function GeneralTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    companyName: '', companyLabel: '', slogan: '', registreCommerce: '', ninea: '',
    phone1: '', phone2: '', email: '', address: '', website: '',
    primaryColor: '#1B4B8A', secondaryColor: '#7AB929',
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const logoFileRef = useRef(null);
  const faviconFileRef = useRef(null);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get('/api/settings');
        const s = data.settings;
        setForm({
          companyName: s.companyName || '', companyLabel: s.companyLabel || '', slogan: s.slogan || '',
          registreCommerce: s.registreCommerce || '', ninea: s.ninea || '',
          phone1: s.phone1 || '', phone2: s.phone2 || '', email: s.email || '', address: s.address || '',
          website: s.website || '', primaryColor: s.primaryColor || '#1B4B8A', secondaryColor: s.secondaryColor || '#7AB929',
        });
        if (s.logo) setLogoPreview(s.logo);
        if (s.favicon) setFaviconPreview(s.favicon);
      } catch { /* Settings pas encore créés */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoPreview(url); logoFileRef.current = file; }
    else { setFaviconPreview(url); faviconFileRef.current = file; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
      if (logoFileRef.current) formData.append('logo', logoFileRef.current);
      if (faviconFileRef.current) formData.append('favicon', faviconFileRef.current);
      await axiosInstance.put('/api/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      logoFileRef.current = null; faviconFileRef.current = null;
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erreur lors de la sauvegarde' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="py-16 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
          }`}>{message.text}</motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Image size={16} className="text-primary" /><h2 className="text-sm font-bold text-gray-900">Logo & Favicon</h2></div>

            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
              <div onClick={() => logoInputRef.current?.click()}
                className="mx-auto w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-gray-50 hover:bg-primary/5">
                {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" /> : <Upload size={24} className="text-gray-400" />}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleFileChange('logo')} />
              <button type="button" onClick={() => logoInputRef.current?.click()} className="mt-2 text-[11px] text-primary font-medium hover:underline">Changer le logo</button>
            </div>

            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 mb-2">Favicon</p>
              <div onClick={() => faviconInputRef.current?.click()}
                className="mx-auto w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-gray-50 hover:bg-primary/5">
                {faviconPreview ? <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain p-0.5" /> : <Upload size={16} className="text-gray-400" />}
              </div>
              <input ref={faviconInputRef} type="file" accept="image/*,.ico" hidden onChange={handleFileChange('favicon')} />
              <button type="button" onClick={() => faviconInputRef.current?.click()} className="mt-2 text-[11px] text-primary font-medium hover:underline">Changer le favicon</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Palette size={16} className="text-primary" /><h2 className="text-sm font-bold text-gray-900">Couleurs</h2></div>
            <div className="space-y-3">
              {[
                { key: 'primaryColor', label: 'Couleur primaire' },
                { key: 'secondaryColor', label: 'Couleur secondaire' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className="w-10 h-9 rounded-lg border-0 cursor-pointer" />
                    <input type="text" name={key} value={form[key]} onChange={handleChange}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all" />
                  </div>
                </div>
              ))}
              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Aperçu</p>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded-lg shadow-sm" style={{ backgroundColor: form.primaryColor }} />
                  <div className="flex-1 h-10 rounded-lg shadow-sm" style={{ backgroundColor: form.secondaryColor }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Building2 size={16} className="text-primary" /><h2 className="text-sm font-bold text-gray-900">Informations de l'entreprise</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Nom de l'entreprise" name="companyName" value={form.companyName} onChange={handleChange} required />
              <InputField label="Raison sociale" name="companyLabel" value={form.companyLabel} onChange={handleChange} />
              <div className="sm:col-span-2"><InputField label="Slogan" name="slogan" value={form.slogan} onChange={handleChange} /></div>
              <InputField label="Registre de commerce (RC)" name="registreCommerce" value={form.registreCommerce} onChange={handleChange} />
              <InputField label="NINEA" name="ninea" value={form.ninea} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Phone size={16} className="text-primary" /><h2 className="text-sm font-bold text-gray-900">Contact</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Téléphone 1" name="phone1" value={form.phone1} onChange={handleChange} />
              <InputField label="Téléphone 2" name="phone2" value={form.phone2} onChange={handleChange} />
              <InputField label="Adresse e-mail" name="email" value={form.email} onChange={handleChange} type="email" />
              <InputField label="Adresse physique" name="address" value={form.address} onChange={handleChange} />
              <div className="sm:col-span-2"><InputField label="Site web" name="website" value={form.website} onChange={handleChange} type="url" /></div>
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-primary to-primary-light text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-shadow disabled:opacity-60">
              <Save size={16} />{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </motion.button>
          </div>
        </div>
      </div>
    </form>
  );
}

function InputField({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-[11px] font-medium text-gray-500 mb-1 block">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input id={name} type={type} name={name} value={value} onChange={onChange} required={required}
        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all bg-white" />
    </div>
  );
}
