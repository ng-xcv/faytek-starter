import { PATH_DASHBOARD } from '../../../routes/paths';

const navConfig = [
  {
    subheader: 'Général',
    items: [
      {
        title: 'Tableau de bord',
        path: PATH_DASHBOARD.general.app,
        icon: 'mdi:home',
      },
      {
        title: 'Utilisateurs',
        path: PATH_DASHBOARD.users.list,
        icon: 'mdi:account-group',
      },
    ],
  },
];

export default navConfig;
