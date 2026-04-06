import { Box } from '@mui/material';
import PropTypes from 'prop-types';

const COLOR_MAP = {
  primary: { main: '#1B4B8A', light: '#e8eef6' },
  secondary: { main: '#7AB929', light: '#f0f7e6' },
  success: { main: '#2e7d32', light: '#e8f5e9' },
  error: { main: '#c62828', light: '#fde8e8' },
  warning: { main: '#e65100', light: '#fff3e0' },
  info: { main: '#0277bd', light: '#e1f5fe' },
  default: { main: '#637381', light: '#f4f6f8' },
};

export default function Label({ children, color = 'default', variant = 'filled', sx, ...other }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.default;

  const styles = {
    filled: {
      bgcolor: colors.main,
      color: '#fff',
    },
    outlined: {
      bgcolor: 'transparent',
      color: colors.main,
      border: `1px solid ${colors.main}`,
    },
    ghost: {
      bgcolor: colors.light,
      color: colors.main,
    },
  };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: 1.5,
        ...styles[variant],
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

Label.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info', 'default']),
  variant: PropTypes.oneOf(['filled', 'outlined', 'ghost']),
  sx: PropTypes.object,
};
