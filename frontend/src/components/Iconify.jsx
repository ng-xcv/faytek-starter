import { Box } from '@mui/material';
import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

export default function Iconify({ icon, width = 20, sx, ...other }) {
  return (
    <Box
      component={Icon}
      icon={icon}
      sx={{ width, height: width, ...sx }}
      {...other}
    />
  );
}

Iconify.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  width: PropTypes.number,
  sx: PropTypes.object,
};
