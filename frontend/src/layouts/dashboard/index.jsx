import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import DashboardHeader from './header/DashboardHeader';
import NavbarVertical from './navbar/NavbarVertical';
import { NAVBAR, HEADER } from '../../config';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navbar */}
      <NavbarVertical isOpenSidebar={open} onCloseSidebar={() => setOpen(false)} />

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ml: { md: `${NAVBAR.DASHBOARD_WIDTH}px` },
        }}
      >
        <DashboardHeader onOpenSidebar={() => setOpen(true)} />
        <Box
          sx={{
            flexGrow: 1,
            pt: `${HEADER.DASHBOARD_DESKTOP_HEIGHT}px`,
            px: { xs: 2, md: 3 },
            pb: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
