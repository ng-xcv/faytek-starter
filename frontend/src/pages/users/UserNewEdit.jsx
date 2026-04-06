import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { FormProvider, RHFTextField, RHFSelect } from '../../components/hook-form';
import { createUser, updateUser } from '../../redux/slices/userSlice';
import axiosInstance from '../../utils/axios';
import { PATH_DASHBOARD } from '../../routes/paths';

const createSchema = Yup.object().shape({
  nom: Yup.string().required('Nom requis'),
  prenom: Yup.string().required('Prénom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, 'Minimum 6 caractères').required('Mot de passe requis'),
  telephone: Yup.string().optional(),
  profil: Yup.string().optional(),
});

const editSchema = Yup.object().shape({
  nom: Yup.string().required('Nom requis'),
  prenom: Yup.string().required('Prénom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().optional(),
  telephone: Yup.string().optional(),
  profil: Yup.string().optional(),
});

export default function UserNewEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [profils, setProfils] = useState([]);

  const methods = useForm({
    resolver: yupResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      password: '',
      telephone: '',
      profil: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    // Load profils
    axiosInstance.get('/api/profil').then((r) => setProfils(r.data)).catch(() => {});

    // Load user for edit
    if (isEdit) {
      axiosInstance.get(`/api/user/${id}`).then((r) => {
        const u = r.data;
        reset({
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          password: '',
          telephone: u.telephone || '',
          profil: u.profil?._id || '',
        });
      }).catch(() => {});
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      if (isEdit && !payload.password) delete payload.password;

      if (isEdit) {
        await dispatch(updateUser({ id, data: payload })).unwrap();
        enqueueSnackbar('Utilisateur modifié', { variant: 'success' });
      } else {
        await dispatch(createUser(payload)).unwrap();
        enqueueSnackbar('Utilisateur créé', { variant: 'success' });
      }
      navigate(PATH_DASHBOARD.users.list);
    } catch (err) {
      enqueueSnackbar(err || 'Une erreur est survenue', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Card sx={{ maxWidth: 640 }}>
        <CardHeader
          title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        />
        <CardContent>
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <RHFTextField name="nom" label="Nom" />
                <RHFTextField name="prenom" label="Prénom" />
              </Box>
              <RHFTextField name="email" label="Email" type="email" />
              <RHFTextField
                name="password"
                label={isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                type="password"
              />
              <RHFTextField name="telephone" label="Téléphone" />
              <RHFSelect name="profil" label="Profil">
                <MenuItem value="">-- Aucun profil --</MenuItem>
                {profils.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.libelle}
                  </MenuItem>
                ))}
              </RHFSelect>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="outlined" onClick={() => navigate(PATH_DASHBOARD.users.list)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {isEdit ? 'Enregistrer' : 'Créer'}
                </Button>
              </Box>
            </Box>
          </FormProvider>
        </CardContent>
      </Card>
    </Box>
  );
}
