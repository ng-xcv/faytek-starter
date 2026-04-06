import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';

export default function RHFSelect({ name, label, children, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={label}
          error={!!error}
          helperText={error?.message}
          {...other}
        >
          {children}
        </TextField>
      )}
    />
  );
}

RHFSelect.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  children: PropTypes.node,
};

export { MenuItem };
