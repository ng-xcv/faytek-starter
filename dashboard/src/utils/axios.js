import axios from 'axios';
import { HOST_API } from '../config';

const axiosInstance = axios.create({
  baseURL: HOST_API,
  withCredentials: true,
});

// URLs qui ne doivent pas declencher de redirect sur echec
const SILENT_URLS = ['/api/auth/my-account', '/api/auth/refresh', '/api/auth/login'];

// Intercepteur : refresh automatique sur 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Si c'est un appel silent (check auth initial), on laisse l'erreur remonter sans redirect
    const isSilent = SILENT_URLS.some((s) => url.includes(s));

    if (error.response?.status === 401 && !originalRequest._retry && !isSilent) {
      originalRequest._retry = true;

      try {
        await axios.post(`${HOST_API}/api/auth/refresh`, {}, { withCredentials: true });
        return axiosInstance(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
