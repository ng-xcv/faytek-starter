import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { FormProvider, RHFTextField } from '../../components/hook-form';
import useAuth from '../../hooks/useAuth';

const schema = Yup.object().shape({
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, 'Minimum 6 caractères').required('Mot de passe requis'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Identifiants incorrects', {
        variant: 'error',
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/src/assets/logo.svg"
              alt="Faytek"
              sx={{ width: 64, height: 64 }}
            />
          </Box>

          <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
            Connexion
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Entrez vos identifiants pour continuer
          </Typography>

          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <RHFTextField name="email" label="Email" type="email" autoComplete="email" />
              <RHFTextField
                name="password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Box>
          </FormProvider>
        </CardContent>
      </Card>
    </Box>
  );
}
