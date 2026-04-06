import { Box, CircularProgress } from '@mui/material';

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress color="primary" size={48} />
    </Box>
  );
}
