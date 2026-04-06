import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import store, { persistor } from './redux/store';
import ThemeProvider from './theme';
import { AuthProvider } from './contexts/AuthContext';
import Router from './routes';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Router />
              </SnackbarProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </ReduxProvider>
  );
}
