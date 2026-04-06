import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField } from '@mui/material';

export default function RHFTextField({ name, label, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          error={!!error}
          helperText={error?.message}
          {...other}
        />
      )}
    />
  );
}

RHFTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
};
