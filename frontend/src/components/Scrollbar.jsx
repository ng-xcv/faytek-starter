import SimpleBarReact from 'simplebar-react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import 'simplebar-react/dist/simplebar.min.css';

export default function Scrollbar({ children, sx, ...other }) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    return (
      <Box sx={{ overflowX: 'auto', ...sx }} {...other}>
        {children}
      </Box>
    );
  }

  return (
    <SimpleBarReact
      style={{ maxHeight: '100%' }}
      {...other}
    >
      <Box sx={sx}>{children}</Box>
    </SimpleBarReact>
  );
}

Scrollbar.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
