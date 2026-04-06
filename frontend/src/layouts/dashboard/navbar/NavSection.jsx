import { Box, Typography, List } from '@mui/material';
import PropTypes from 'prop-types';
import NavItem from './NavItem';

export default function NavSection({ data }) {
  return (
    <Box sx={{ mb: 2 }}>
      {data.map((group) => (
        <Box key={group.subheader} sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.disabled',
              fontSize: '0.65rem',
            }}
          >
            {group.subheader}
          </Typography>
          <List disablePadding sx={{ px: 1 }}>
            {group.items.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
}

NavSection.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      subheader: PropTypes.string,
      items: PropTypes.array,
    })
  ).isRequired,
};
