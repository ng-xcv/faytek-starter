import useAuth from './useAuth';

export default function usePermissions() {
  const { user } = useAuth();

  const can = (module, action) => {
    if (!user?.profil) return false;
    const { libelle, permissions } = user.profil;
    if (libelle === 'Admin') return true;
    if (!permissions) return false;
    return permissions?.[module]?.[action] === true;
  };

  return { can };
}
