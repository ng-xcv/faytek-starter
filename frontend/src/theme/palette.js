// ─── BuyFlow Palette ─────────────────────────────────────────────────────

const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
  500_8: 'rgba(145, 158, 171, 0.08)',
  500_12: 'rgba(145, 158, 171, 0.12)',
  500_16: 'rgba(145, 158, 171, 0.16)',
  500_24: 'rgba(145, 158, 171, 0.24)',
  500_32: 'rgba(145, 158, 171, 0.32)',
  500_48: 'rgba(145, 158, 171, 0.48)',
  500_56: 'rgba(145, 158, 171, 0.56)',
  500_80: 'rgba(145, 158, 171, 0.80)',
};

const PRIMARY = {
  lighter: '#D0DCEF',
  light: '#7A9DC8',
  main: '#1B4B8A',
  dark: '#133766',
  darker: '#0B2344',
  contrastText: '#FFFFFF',
};

const SECONDARY = {
  lighter: '#E5F3CC',
  light: '#B3D97A',
  main: '#7AB929',
  dark: '#5A8A1E',
  darker: '#3A5B13',
  contrastText: '#FFFFFF',
};

const INFO = {
  lighter: '#D0F2FF',
  light: '#74CAFF',
  main: '#1890FF',
  dark: '#0C53B7',
  darker: '#04297A',
  contrastText: '#FFFFFF',
};

const SUCCESS = {
  lighter: '#E9FCD4',
  light: '#AAF27F',
  main: '#54D62C',
  dark: '#229A16',
  darker: '#08660D',
  contrastText: '#212B36',
};

const WARNING = {
  lighter: '#FFF7CD',
  light: '#FFE16A',
  main: '#FFC107',
  dark: '#B78103',
  darker: '#7A4F01',
  contrastText: '#212B36',
};

const ERROR = {
  lighter: '#FFE7D9',
  light: '#FFA48D',
  main: '#FF4842',
  dark: '#B72136',
  darker: '#7A0C2E',
  contrastText: '#FFFFFF',
};

const palette = {
  common: { black: '#000', white: '#fff' },
  primary: PRIMARY,
  secondary: SECONDARY,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  grey: GREY,
  divider: GREY[500_24],
  text: {
    primary: GREY[800],
    secondary: GREY[600],
    disabled: GREY[500],
  },
  background: {
    paper: '#fff',
    default: GREY[100],
    neutral: GREY[200],
  },
  action: {
    active: GREY[600],
    hover: GREY[500_8],
    selected: GREY[500_16],
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

export default palette;
