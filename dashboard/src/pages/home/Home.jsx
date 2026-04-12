import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Settings,
  Send,
  Headphones,
  SlidersHorizontal,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileWarning,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import axiosInstance from "../../utils/axios";
import KpiBanner from "../../components/ui/KpiBanner";
import ModuleCard from "../../components/ui/ModuleCard";
import FlashTicker from "../../components/ui/FlashTicker";

// ─── Modules disponibles ──────────────────────────────────────────────────
const MODULES = [
  {
    id: "buyflow",
    title: "BuyFlow",
    subtitle: "Gestion des DA & Validation",
    icon: ShoppingCart,
  },
  {
    id: "actionplan",
    title: "ActionPlan",
    subtitle: "Gestion des plans d'actions",
    icon: Settings,
  },
  {
    id: "missionflow",
    title: "MissionFlow",
    subtitle: "Ordres de mission & Frais",
    icon: Send,
  },
  {
    id: "itsupport",
    title: "IT Support",
    subtitle: "Gestion des DI & Indicateurs",
    icon: Headphones,
  },
  {
    id: "parametrage",
    title: "Paramétrage",
    subtitle: "Informations & thème entreprise",
    icon: SlidersHorizontal,
  },
];

// ─── Messages flash (statiques pour le starter, à connecter à un endpoint) ─
const FLASH_MESSAGES = [
  {
    type: "meeting",
    text: "Prochaine revue qualite : Vendredi 18 avril a 10h00",
  },
  {
    type: "relance",
    text: "3 non-conformites critiques en attente de traitement",
  },
  { type: "info", text: "Mise a jour du systeme prevue ce weekend" },
  { type: "warning", text: "Audit interne planifie pour le 25 avril" },
  {
    type: "relance",
    text: "Relance : 5 actions correctives depassent la date echeance",
  },
];

export default function Home() {
  const { user, logout } = useAuth();
  const { companyName, slogan, logo } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ncOuvertes: 0,
    ncCritiques: 0,
    ncEnCours: 0,
    ncCloturees: 0,
    totalUsers: 0,
    ncTotal: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch NC stats
        const { data: ncData } = await axiosInstance.get("/api/non-conformite");
        const ncs = ncData.nonConformites || [];
        const ncOuvertes = ncs.filter((nc) => nc.statut === "Ouverte").length;
        const ncCritiques = ncs.filter(
          (nc) => nc.gravite === "Critique",
        ).length;
        const ncEnCours = ncs.filter((nc) => nc.statut === "En cours").length;
        const ncCloturees = ncs.filter((nc) => nc.statut === "Clôturée").length;

        // Fetch users count
        let totalUsers = 0;
        try {
          const { data: userData } = await axiosInstance.get("/api/user");
          totalUsers = userData.users?.length || 0;
        } catch {
          // L'utilisateur n'a peut-etre pas les permissions users
        }

        setStats({
          ncOuvertes,
          ncCritiques,
          ncEnCours,
          ncCloturees,
          totalUsers,
          ncTotal: ncs.length,
        });
      } catch {
        // Si pas de permissions NC, on laisse les stats a 0
      }
    };

    fetchStats();
  }, []);

  const handleModuleClick = (moduleId) => {
    if (moduleId === "parametrage") {
      navigate("/settings");
      return;
    }
    // Pour l'instant, stocke le module et navigue
    localStorage.setItem("selectedModule", moduleId);
    navigate(`/module/${moduleId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const kpis = [
    {
      icon: AlertTriangle,
      label: "NC Ouvertes",
      value: stats.ncOuvertes,
      color: "danger",
      trend: null,
    },
    {
      icon: FileWarning,
      label: "NC Critiques",
      value: stats.ncCritiques,
      color: "warning",
      trend: null,
    },
    {
      icon: Clock,
      label: "En cours",
      value: stats.ncEnCours,
      color: "info",
      trend: null,
    },
    {
      icon: CheckCircle2,
      label: "Cloturees",
      value: stats.ncCloturees,
      color: "success",
      trend: null,
    },
    {
      icon: TrendingUp,
      label: "Total NC",
      value: stats.ncTotal,
      color: "primary",
      trend: null,
    },
    {
      icon: Users,
      label: "Utilisateurs",
      value: stats.totalUsers,
      color: "secondary",
      trend: null,
    },
  ];

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], y: [0, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-2.5 bg-white/50 backdrop-blur-md border-b border-gray-200/50 shrink-0"
      >
        <div className="flex items-center gap-2.5">
          {logo ? (
            <div className="w-9 h-9 rounded-lg bg-white border border-gray-200/70 flex items-center justify-center p-1 overflow-hidden shadow-sm">
              <img
                src={logo}
                alt={companyName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-xs font-bold text-white">
                {companyName?.[0] || 'F'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              {companyName || 'Faytek Solution'}
            </h1>
            <p className="text-[10px] text-muted">
              {slogan || 'Technologies Services'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-900">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-[10px] text-muted">
                  {user.profil?.nom || "Utilisateur"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-xs font-bold shadow-md">
                {user.prenom?.[0]}
                {user.nom?.[0]}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200"
            title="Deconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </motion.header>

      {/* Main content — flex-1 pour remplir l'espace restant */}
      {/* KPI Banner — colle en haut */}
      <div className="relative z-10 shrink-0 px-4 sm:px-6 lg:px-10 pt-4">
        <KpiBanner kpis={kpis} />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 pb-2 overflow-hidden">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-5"
        >
          {/* <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
            Welcome
          </span> */}
          <h2 className="text-lg font-bold text-gray-700 tracking-tight">
            Que voulez vous gérer aujourd'hui ?
          </h2>
          {/* <p className="text-muted mt-1 max-w-sm mx-auto text-xs">
            Choisissez un module pour acceder a votre espace de travail.
          </p> */}
        </motion.div>

        {/* Module Cards Grid */}
        <div className="w-full max-w-4xl grid grid-cols-2 lg:grid-cols-5 gap-4">
          {MODULES.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              id={mod.id}
              icon={mod.icon}
              title={mod.title}
              subtitle={mod.subtitle}
              onClick={handleModuleClick}
              delay={i}
            />
          ))}
        </div>
      </main>

      {/* Flash ticker at bottom */}
      <div className="relative z-10 shrink-0">
        <FlashTicker messages={FLASH_MESSAGES} />
      </div>
    </div>
  );
}
