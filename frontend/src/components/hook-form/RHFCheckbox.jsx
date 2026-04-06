import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox, FormControlLabel, FormHelperText } from '@mui/material';

export default function RHFCheckbox({ name, label, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <>
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                checked={field.value}
                {...other}
              />
            }
            label={label}
          />
          {error && <FormHelperText error>{error.message}</FormHelperText>}
        </>
      )}
    />
  );
}

RHFCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
};
