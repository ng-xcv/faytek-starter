import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

export default function Page404() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Typography
        variant="h1"
        sx={{ fontSize: '8rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}
      >
        404
      </Typography>
      <Typography variant="h5" fontWeight={700} mt={2} mb={1}>
        Page introuvable
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4} maxWidth={400}>
        Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
      >
        Retour à l'accueil
      </Button>
    </Box>
  );
}
