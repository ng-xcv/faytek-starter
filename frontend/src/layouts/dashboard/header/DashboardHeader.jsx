import { AppBar, Toolbar, Box, Typography, Avatar, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PropTypes from 'prop-types';
import useAuth from '../../../hooks/useAuth';
import useResponsive from '../../../hooks/useResponsive';
import { HEADER, NAVBAR } from '../../../config';

export default function DashboardHeader({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const { isDesktop } = useResponsive();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${NAVBAR.DASHBOARD_WIDTH}px)` },
        ml: { md: `${NAVBAR.DASHBOARD_WIDTH}px` },
        height: HEADER.DASHBOARD_DESKTOP_HEIGHT,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ height: '100%', px: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between' }}>
        {/* Left */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isDesktop && (
            <IconButton onClick={onOpenSidebar}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} color="primary">
            Faytek Starter
          </Typography>
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user?.img}
            alt={user?.nom}
            sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
          >
            {user?.nom?.[0]}
          </Avatar>
          <Typography variant="body2" fontWeight={600} display={{ xs: 'none', sm: 'block' }}>
            {user?.prenom} {user?.nom}
          </Typography>
          <Button
            startIcon={<LogoutIcon />}
            onClick={logout}
            color="inherit"
            size="small"
          >
            Déconnexion
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

DashboardHeader.propTypes = {
  onOpenSidebar: PropTypes.func.isRequired,
};
