import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import axiosInstance from "../utils/axios";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  companyName: "Faytek Solution",
  companyLabel: "",
  slogan: "",
  registreCommerce: "",
  ninea: "",
  phone1: "",
  phone2: "",
  email: "",
  address: "",
  primaryColor: "#1B4B8A",
  secondaryColor: "#7AB929",
  logo: "",
  favicon: "",
};

// ─── Génère les variantes hex d'une couleur de base ─────────────────────────
function hexToVariants(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c, t, f) => Math.round(c * (1 - f) + t * f);
  const toHex = (r2, g2, b2) =>
    `#${[r2, g2, b2].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  return {
    light: toHex(mix(r, 255, 0.3), mix(g, 255, 0.3), mix(b, 255, 0.3)),
    main: hex,
    dark: toHex(mix(r, 0, 0.25), mix(g, 0, 0.25), mix(b, 0, 0.25)),
  };
}

// ─── Applique les couleurs dynamiques sur le :root ──────────────────────────
function applyColorVariables(primary, secondary) {
  const p = hexToVariants(primary);
  const s = hexToVariants(secondary);
  const root = document.documentElement;
  root.style.setProperty("--color-primary", p.main);
  root.style.setProperty("--color-primary-light", p.light);
  root.style.setProperty("--color-primary-dark", p.dark);
  root.style.setProperty("--color-secondary", s.main);
  root.style.setProperty("--color-secondary-light", s.light);
  root.style.setProperty("--color-secondary-dark", s.dark);
}

const CACHE_KEY = "faytek_settings_cache";

function loadCachedSettings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadCachedSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/settings");
      setSettings(data.settings);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.settings));
      } catch {
        /* ignore */
      }
    } catch {
      // fallback sur les valeurs par défaut
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Applique les couleurs dynamiquement
  useEffect(() => {
    if (settings.primaryColor && settings.secondaryColor) {
      applyColorVariables(settings.primaryColor, settings.secondaryColor);
    }
  }, [settings.primaryColor, settings.secondaryColor]);

  // Favicon
  useEffect(() => {
    if (settings.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon;
    }
  }, [settings.favicon]);

  // Titre de l'onglet
  useEffect(() => {
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  }, [settings.companyName]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const value = useMemo(
    () => ({ ...settings, loading, refreshSettings }),
    [settings, loading, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
