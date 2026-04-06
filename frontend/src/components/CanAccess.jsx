import PropTypes from 'prop-types';
import usePermissions from '../hooks/usePermissions';

export default function CanAccess({ module, action, children }) {
  const { can } = usePermissions();

  if (!can(module, action)) return null;

  return children;
}

CanAccess.propTypes = {
  module: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
