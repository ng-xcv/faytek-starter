const ROOTS_DASHBOARD = '/dashboard';

export const PATH_AUTH = {
  login: '/auth/login',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    app: `${ROOTS_DASHBOARD}/home`,
  },
  users: {
    root: `${ROOTS_DASHBOARD}/users`,
    list: `${ROOTS_DASHBOARD}/users/list`,
    new: `${ROOTS_DASHBOARD}/users/new`,
    edit: (id) => `${ROOTS_DASHBOARD}/users/${id}/edit`,
  },
};
