import PropTypes from 'prop-types';
import { FormProvider as RHFFormProvider } from 'react-hook-form';

export default function FormProvider({ children, methods, onSubmit }) {
  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate>
        {children}
      </form>
    </RHFFormProvider>
  );
}

FormProvider.propTypes = {
  children: PropTypes.node.isRequired,
  methods: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
};
