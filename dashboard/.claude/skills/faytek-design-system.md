# Skill : Design System Faytek Starter

> Lire ce fichier AVANT de générer ou modifier toute page ou composant frontend.
> Ce fichier définit l'identité visuelle du projet. Il prime sur les préférences par défaut.
> Croiser avec `.claude/skills/frontend-design-pro/SKILL.md` et `web-design-guidelines/SKILL.md`.

---

## Palette de couleurs

```js
// frontend/src/theme/palette.js — valeurs de référence
PRIMARY = "#1B4B8A"; // Bleu Faytek — actions principales, header, liens actifs
SECONDARY = "#7AB929"; // Vert — succès, badges positifs, accents

// Niveaux de gris (fond, surface, bordures)
GREY_100 = "#F9FAFB"; // Fond général des pages
GREY_200 = "#F4F6F8"; // Fond des cards légèrement en relief
GREY_300 = "#DFE3E8"; // Bordures, séparateurs
GREY_600 = "#637381"; // Texte secondaire, labels, placeholders
GREY_800 = "#212B36"; // Texte principal
GREY_900 = "#161C24"; // Titres forts

// Statuts sémantiques
SUCCESS = "#54D62C"; // Clôturé, actif, validé
WARNING = "#FFC107"; // En cours, majeure, attention
ERROR = "#FF4842"; // Ouvert, critique, suppression
INFO = "#1890FF"; // Info, mineure, neutre
```

**Règle absolue** : ne jamais hardcoder une couleur → toujours `theme.palette.*` ou `sx={{ color: 'primary.main' }}`.

---

## Typographie

```js
// Hiérarchie dans les pages
h4  → Titre de page principal (ex: "Non-conformités")
h6  → Titre de section / dialog header
subtitle1 → Métadonnée importante (référence NC, date)
subtitle2 → Label de champ, sous-titre de card
body2     → Valeur de champ, contenu de tableau
caption   → Texte secondaire, timestamps, compteurs
```

---

## Layout des pages

### Structure standard d'une page liste

```
┌─────────────────────────────────────────────────────┐
│ [Breadcrumbs]                                        │
│ Titre de page (h4)        [Bouton action principal]  │
├─────────────────────────────────────────────────────┤
│ [Cards stats : 4 métriques rapides]                  │
├─────────────────────────────────────────────────────┤
│ [Bloc filtres : selects + recherche + bouton reset]  │
├─────────────────────────────────────────────────────┤
│ [TableContainer → Table MUI]                         │
│   En-têtes grisés + tri                             │
│   Rows : zebra light (GREY_100 sur pair)            │
│   Colonne actions : IconButtons groupés             │
├─────────────────────────────────────────────────────┤
│ [TablePagination]                                    │
└─────────────────────────────────────────────────────┘
```

### Structure standard d'un formulaire

```
┌─────────────────────────────────────────────────────┐
│ [Breadcrumbs]                                        │
│ Titre page (h4)                                      │
├─────────────────────┬───────────────────────────────┤
│ Card section 1      │  Card section 2 (si 2 cols)   │
│ [Champs groupés]    │  [Champs groupés]              │
│                     │                               │
├─────────────────────┴───────────────────────────────┤
│ [Card section optionnelle pleine largeur]            │
├─────────────────────────────────────────────────────┤
│                    [Annuler]  [Enregistrer →]        │
└─────────────────────────────────────────────────────┘
```

---

## Composants MUI — conventions projet

### Card standard

```jsx
<Card
  sx={{ borderRadius: 2, boxShadow: (theme) => theme.customShadows?.card || 3 }}
>
  <CardHeader
    title="Titre de section"
    titleTypographyProps={{ variant: "h6" }}
    sx={{ pb: 0 }}
  />
  <CardContent>{/* contenu */}</CardContent>
</Card>
```

### Card stat (métrique rapide)

```jsx
// 4 cards en Grid : total, ouvertes, critiques, clôturées
<Card
  sx={{ p: 3, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}
>
  <Box
    sx={{
      width: 56,
      height: 56,
      borderRadius: 1.5,
      bgcolor: "primary.lighter", // ou warning.lighter, error.lighter
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Iconify
      icon="mdi:alert-circle-outline"
      width={28}
      sx={{ color: "primary.main" }}
    />
  </Box>
  <Box>
    <Typography variant="h4">{count}</Typography>
    <Typography variant="subtitle2" color="text.secondary">
      Label
    </Typography>
  </Box>
</Card>
```

### Label (badge statut/gravité)

```jsx
// Utiliser le composant Label existant du starter
<Label
  color="error" // 'success' | 'warning' | 'error' | 'info' | 'default'
  variant="soft" // 'soft' pour un rendu léger dans les tableaux
>
  Critique
</Label>
```

### Tableau MUI — pattern standard

```jsx
<TableContainer component={Paper} sx={{ borderRadius: 2 }}>
  <Table>
    <TableHead sx={{ bgcolor: "grey.200" }}>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            fontSize: "0.75rem",
            textTransform: "uppercase",
          }}
        >
          Colonne
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row, index) => (
        <TableRow
          key={row._id}
          hover
          sx={{
            "&:last-child td": { border: 0 },
            bgcolor: index % 2 === 0 ? "grey.50" : "white",
          }}
        >
          <TableCell>{/* valeur */}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Bloc filtres

```jsx
<Card sx={{ p: 2.5, mb: 3 }}>
  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
    <TextField
      size="small"
      placeholder="Rechercher..."
      InputProps={{
        startAdornment: (
          <Iconify icon="mdi:magnify" sx={{ mr: 1, color: "text.disabled" }} />
        ),
      }}
      sx={{ minWidth: 220 }}
    />
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Statut</InputLabel>
      <Select label="Statut">{/* options */}</Select>
    </FormControl>
    {/* Bouton reset visible seulement si filtres actifs */}
    {hasFilters && (
      <Button
        variant="text"
        color="error"
        startIcon={<Iconify icon="mdi:filter-remove-outline" />}
        onClick={resetFilters}
      >
        Réinitialiser
      </Button>
    )}
  </Stack>
</Card>
```

### Bouton d'action principal (header de page)

```jsx
<Button
  variant="contained"
  startIcon={<Iconify icon="mdi:plus" />}
  component={RouterLink}
  to={PATH_DASHBOARD.nonConformites.new}
>
  Nouvelle NC
</Button>
```

### Actions dans un tableau (colonne Actions)

```jsx
// Grouper dans un Stack horizontal compact
<Stack direction="row" spacing={0.5}>
  <Tooltip title="Voir">
    <IconButton
      size="small"
      component={RouterLink}
      to={PATH_DASHBOARD.nonConformites.detail(row._id)}
    >
      <Iconify icon="mdi:eye-outline" width={18} />
    </IconButton>
  </Tooltip>
  <CanAccess module="nonConformites" action="modifier">
    <Tooltip title="Modifier">
      <IconButton
        size="small"
        component={RouterLink}
        to={PATH_DASHBOARD.nonConformites.edit(row._id)}
      >
        <Iconify icon="mdi:pencil-outline" width={18} />
      </IconButton>
    </Tooltip>
  </CanAccess>
  <CanAccess module="nonConformites" action="supprimer">
    <Tooltip title="Supprimer">
      <IconButton
        size="small"
        color="error"
        onClick={() => handleDelete(row._id)}
      >
        <Iconify icon="mdi:trash-can-outline" width={18} />
      </IconButton>
    </Tooltip>
  </CanAccess>
</Stack>
```

### Dialog de confirmation suppression

```jsx
<Dialog
  open={openConfirm}
  onClose={() => setOpenConfirm(false)}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle>Confirmer la suppression</DialogTitle>
  <DialogContent>
    <Typography>
      Êtes-vous sûr de vouloir supprimer <strong>{selectedItem?.titre}</strong>{" "}
      ? Cette action est irréversible.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenConfirm(false)}>Annuler</Button>
    <Button
      variant="contained"
      color="error"
      onClick={confirmDelete}
      loading={loading}
    >
      Supprimer
    </Button>
  </DialogActions>
</Dialog>
```

### État vide (liste sans données)

```jsx
{
  !loading && rows.length === 0 && (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Iconify
        icon="mdi:inbox-outline"
        width={64}
        sx={{ color: "text.disabled", mb: 2 }}
      />
      <Typography variant="h6" color="text.secondary">
        Aucun résultat
      </Typography>
      <Typography variant="body2" color="text.disabled">
        {hasFilters
          ? "Essayez de modifier vos filtres"
          : "Aucune entrée pour le moment"}
      </Typography>
    </Box>
  );
}
```

### État chargement (skeleton)

```jsx
{
  loading && (
    <Stack spacing={1} sx={{ p: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={52}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Stack>
  );
}
```

---

## Formulaires — conventions RHF + MUI

### Groupement des champs en Grid

```jsx
<Grid container spacing={3}>
  {/* Section 1 */}
  <Grid item xs={12}>
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Informations générales
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RHFTextField name="titre" label="Titre *" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RHFSelect name="type" label="Type *">
            {/* options */}
          </RHFSelect>
        </Grid>
        <Grid item xs={12}>
          <RHFTextField
            name="description"
            label="Description *"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </Card>
  </Grid>

  {/* Section 2 */}
  <Grid item xs={12} md={6}>
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Classification
      </Typography>
      {/* champs */}
    </Card>
  </Grid>

  {/* Boutons */}
  <Grid item xs={12}>
    <Stack direction="row" justifyContent="flex-end" spacing={2}>
      <Button
        variant="outlined"
        component={RouterLink}
        to={PATH_DASHBOARD.nonConformites.list}
      >
        Annuler
      </Button>
      <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
        {isEdit ? "Enregistrer les modifications" : "Créer la non-conformité"}
      </LoadingButton>
    </Stack>
  </Grid>
</Grid>
```

---

## Breadcrumbs — pattern standard

```jsx
// En haut de chaque page, sous le header
<Box sx={{ mb: 3 }}>
  <Typography variant="h4" gutterBottom>
    Non-conformités
  </Typography>
  <Breadcrumbs>
    <Link component={RouterLink} to="/dashboard">
      Tableau de bord
    </Link>
    <Typography color="text.primary">Non-conformités</Typography>
  </Breadcrumbs>
</Box>
```

---

## Page détail — pattern (fiche)

```
┌────────────────────────────────────────────────────┐
│ [Breadcrumbs + titre]         [Boutons : Modifier]  │
├─────────────────────┬──────────────────────────────┤
│ Card infos (2/3)    │ Card actions (1/3)            │
│ - référence chip    │ - Statut actuel (Label)       │
│ - titre h5          │ - [Valider] (CanAccess)       │
│ - grille champs     │ - [Clôturer] (CanAccess)      │
│                     │ - [Exporter] (CanAccess)      │
├─────────────────────┴──────────────────────────────┤
│ Card action corrective (pleine largeur)             │
└────────────────────────────────────────────────────┘
```

---

## Matrice de permissions (ProfilForm)

```jsx
// Tableau avec header sticky, cellules Switch compactes
<TableContainer
  sx={{
    maxHeight: 400,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 1,
  }}
>
  <Table size="small" stickyHeader>
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 700, minWidth: 150, bgcolor: "grey.100" }}>
          Module
        </TableCell>
        {ACTIONS.map((action) => (
          <TableCell
            key={action}
            align="center"
            sx={{
              fontWeight: 600,
              bgcolor: "grey.100",
              fontSize: "0.7rem",
              textTransform: "uppercase",
            }}
          >
            {ACTION_LABELS[action]} {/* ex: 'Voir liste', 'Créer', etc. */}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {MODULES.map((module, i) => (
        <TableRow
          key={module}
          sx={{ bgcolor: i % 2 === 0 ? "grey.50" : "white" }}
        >
          <TableCell sx={{ fontWeight: 500 }}>
            {MODULE_LABELS[module]}
          </TableCell>
          {ACTIONS.map((action) => (
            <TableCell key={action} align="center" padding="checkbox">
              <Controller
                name={`permissions.${module}.${action}`}
                control={control}
                render={({ field }) => (
                  <Switch
                    size="small"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={watchIsAdmin}
                    color="primary"
                  />
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

Labels lisibles à définir :

```js
const MODULE_LABELS = {
  users: "Utilisateurs",
  profils: "Profils & Accès",
  nonConformites: "Non-conformités",
};

const ACTION_LABELS = {
  voirListe: "Voir liste",
  voir: "Détail",
  creer: "Créer",
  modifier: "Modifier",
  supprimer: "Supprimer",
  valider: "Valider",
  exporter: "Exporter",
};
```

---

## Icônes recommandées (mdi)

```
Users             → mdi:account-group-outline
Profils/Accès     → mdi:shield-account-outline
Non-conformités   → mdi:alert-circle-outline
Voir              → mdi:eye-outline
Modifier          → mdi:pencil-outline
Supprimer         → mdi:trash-can-outline
Valider           → mdi:check-circle-outline
Clôturer          → mdi:lock-check-outline
Exporter Excel    → mdi:microsoft-excel
Filtrer           → mdi:filter-outline
Reset filtres     → mdi:filter-remove-outline
Rechercher        → mdi:magnify
Plus (créer)      → mdi:plus
Retour            → mdi:arrow-left
Dashboard         → mdi:view-dashboard-outline
```

---

## Règles UX à toujours respecter

1. **Feedback immédiat** — chaque action (save, delete, validate) déclenche un `enqueueSnackbar`
2. **Loading states** — `loading` button sur tous les submits, Skeleton sur les listes
3. **Empty states** — illustrés avec icône + texte, jamais une page blanche
4. **Confirmation** — toute suppression passe par un Dialog de confirmation
5. **Responsive** — Grid `xs/sm/md` sur tous les layouts, Stack direction responsive
6. **Accessibilité** — Tooltip sur tous les IconButtons, aria-label si pas de texte
7. **Cohérence** — même structure breadcrumbs > titre > contenu sur toutes les pages
8. **Densité** — tableaux en `size="small"`, formulaires `size="medium"`
