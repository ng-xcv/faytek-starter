import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { NavLink, useMatch } from 'react-router-dom';
import PropTypes from 'prop-types';
import Iconify from '../../../components/Iconify';

export default function NavItem({ item }) {
  const { title, path, icon } = item;
  const match = useMatch({ path, end: false });

  return (
    <ListItemButton
      component={NavLink}
      to={path}
      sx={{
        borderRadius: 1,
        mb: 0.5,
        color: match ? 'primary.main' : 'text.secondary',
        bgcolor: match ? 'primary.lighter' : 'transparent',
        '&:hover': {
          bgcolor: match ? 'primary.lighter' : 'action.hover',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
        <Iconify icon={icon} width={22} />
      </ListItemIcon>
      <ListItemText
        primary={title}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: match ? 700 : 400,
        }}
      />
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
};
