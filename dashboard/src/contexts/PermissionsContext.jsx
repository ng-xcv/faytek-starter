import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext({ can: () => false, isAdmin: false, profil: null });

export function PermissionsProvider({ children }) {
  const { user } = useAuth();

  const value = useMemo(() => {
    const profil = user?.profil || null;
    const isAdmin = profil?.isAdmin ?? false;

    const can = (module, action) => {
      if (isAdmin) return true;
      return profil?.permissions?.[module]?.[action] ?? false;
    };

    const canAny = (module, actions = []) => actions.some((a) => can(module, a));

    return { can, canAny, isAdmin, profil };
  }, [user]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

export function CanAccess({ module, action, children, fallback = null }) {
  const { can } = usePermissions();
  if (!module || !action) return children;
  return can(module, action) ? children : fallback;
}
