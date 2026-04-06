import { createContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../utils/axios';
import { isValidToken, setSession } from '../utils/jwt';

// ─── Initial State ───────────────────────────────────────────────────────
const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

// ─── Actions ─────────────────────────────────────────────────────────────
const INITIALIZE = 'INITIALIZE';
const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';
const UPDATE_PROFILE = 'UPDATE_PROFILE';

// ─── Reducer ─────────────────────────────────────────────────────────────
const handlers = {
  [INITIALIZE]: (state, action) => ({
    ...state,
    isAuthenticated: action.payload.isAuthenticated,
    isInitialized: true,
    user: action.payload.user,
  }),
  [LOGIN]: (state, action) => ({
    ...state,
    isAuthenticated: true,
    user: action.payload.user,
  }),
  [LOGOUT]: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
  }),
  [UPDATE_PROFILE]: (state, action) => ({
    ...state,
    user: { ...state.user, ...action.payload.user },
  }),
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

// ─── Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext({
  ...initialState,
  login: () => Promise.resolve(),
  logout: () => {},
  updateProfile: () => Promise.resolve(),
});

// ─── Provider ────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const initialize = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && isValidToken(accessToken)) {
          setSession(accessToken);
          const response = await axiosInstance.get('/api/auth/my-account');
          dispatch({
            type: INITIALIZE,
            payload: { isAuthenticated: true, user: response.data },
          });
        } else {
          dispatch({
            type: INITIALIZE,
            payload: { isAuthenticated: false, user: null },
          });
        }
      } catch {
        dispatch({
          type: INITIALIZE,
          payload: { isAuthenticated: false, user: null },
        });
      }
    };
    initialize();
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    const { accessToken, user } = response.data;
    setSession(accessToken);
    dispatch({ type: LOGIN, payload: { user } });
  };

  const logout = () => {
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  const updateProfile = async (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    const response = await axiosInstance.put('/api/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    dispatch({ type: UPDATE_PROFILE, payload: { user: response.data } });
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
