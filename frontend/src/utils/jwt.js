import { jwtDecode } from 'jwt-decode';

export const isValidToken = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return Date.now() / 1000 < exp;
  } catch {
    return false;
  }
};

export const setSession = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};
