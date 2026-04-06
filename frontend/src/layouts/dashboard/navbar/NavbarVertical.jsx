import { Box, Drawer } from '@mui/material';
import PropTypes from 'prop-types';
import NavSection from './NavSection';
import navConfig from './navConfig';
import { NAVBAR } from '../../../config';
import useResponsive from '../../../hooks/useResponsive';

export default function NavbarVertical({ isOpenSidebar, onCloseSidebar }) {
  const { isDesktop } = useResponsive();

  const renderContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/src/assets/logo.svg"
          alt="Faytek"
          sx={{ width: 40, height: 40 }}
        />
        <Box sx={{ typography: 'h6', fontWeight: 700, color: 'primary.main' }}>
          Faytek
        </Box>
      </Box>

      <NavSection data={navConfig} />
    </Box>
  );

  if (isDesktop) {
    return (
      <Drawer
        open
        variant="permanent"
        PaperProps={{
          sx: {
            width: NAVBAR.DASHBOARD_WIDTH,
            border: 'none',
          },
        }}
      >
        {renderContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      open={isOpenSidebar}
      onClose={onCloseSidebar}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: { width: NAVBAR.DASHBOARD_WIDTH },
      }}
    >
      {renderContent}
    </Drawer>
  );
}

NavbarVertical.propTypes = {
  isOpenSidebar: PropTypes.bool,
  onCloseSidebar: PropTypes.func,
};
