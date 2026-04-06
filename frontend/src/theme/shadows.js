import palette from './palette';

const { primary } = palette;

const LIGHT_MODE = '60, 72, 88';
const LIGHT_TRANSPARENT = 'rgba(145, 158, 171, 0.2)';
const DARK_TRANSPARENT = 'rgba(145, 158, 171, 0.14)';
const DARKER_TRANSPARENT = 'rgba(145, 158, 171, 0.12)';

const shadows = [
  'none',
  `0 1px 2px 0 ${LIGHT_TRANSPARENT}`,
  `0 3px 1px -2px ${LIGHT_TRANSPARENT}, 0 2px 2px 0 ${DARK_TRANSPARENT}, 0 1px 5px 0 ${DARKER_TRANSPARENT}`,
  `0 3px 3px -2px ${LIGHT_TRANSPARENT}, 0 3px 4px 0 ${DARK_TRANSPARENT}, 0 1px 8px 0 ${DARKER_TRANSPARENT}`,
  `0 2px 4px -1px ${LIGHT_TRANSPARENT}, 0 4px 5px 0 ${DARK_TRANSPARENT}, 0 1px 10px 0 ${DARKER_TRANSPARENT}`,
  `0 3px 5px -1px ${LIGHT_TRANSPARENT}, 0 5px 8px 0 ${DARK_TRANSPARENT}, 0 1px 14px 0 ${DARKER_TRANSPARENT}`,
  `0 3px 5px -1px ${LIGHT_TRANSPARENT}, 0 6px 10px 0 ${DARK_TRANSPARENT}, 0 1px 18px 0 ${DARKER_TRANSPARENT}`,
  `0 4px 5px -2px ${LIGHT_TRANSPARENT}, 0 7px 10px 1px ${DARK_TRANSPARENT}, 0 2px 16px 1px ${DARKER_TRANSPARENT}`,
  `0 5px 5px -3px ${LIGHT_TRANSPARENT}, 0 8px 10px 1px ${DARK_TRANSPARENT}, 0 3px 14px 2px ${DARKER_TRANSPARENT}`,
  `0 5px 6px -3px ${LIGHT_TRANSPARENT}, 0 9px 12px 1px ${DARK_TRANSPARENT}, 0 3px 16px 2px ${DARKER_TRANSPARENT}`,
  `0 6px 6px -3px ${LIGHT_TRANSPARENT}, 0 10px 14px 1px ${DARK_TRANSPARENT}, 0 4px 18px 3px ${DARKER_TRANSPARENT}`,
  `0 6px 7px -4px ${LIGHT_TRANSPARENT}, 0 11px 15px 1px ${DARK_TRANSPARENT}, 0 4px 20px 3px ${DARKER_TRANSPARENT}`,
  `0 7px 8px -4px ${LIGHT_TRANSPARENT}, 0 12px 17px 2px ${DARK_TRANSPARENT}, 0 5px 22px 4px ${DARKER_TRANSPARENT}`,
  `0 7px 8px -4px ${LIGHT_TRANSPARENT}, 0 13px 19px 2px ${DARK_TRANSPARENT}, 0 5px 24px 4px ${DARKER_TRANSPARENT}`,
  `0 7px 9px -4px ${LIGHT_TRANSPARENT}, 0 14px 21px 2px ${DARK_TRANSPARENT}, 0 5px 26px 4px ${DARKER_TRANSPARENT}`,
  `0 8px 9px -5px ${LIGHT_TRANSPARENT}, 0 15px 22px 2px ${DARK_TRANSPARENT}, 0 6px 28px 5px ${DARKER_TRANSPARENT}`,
  `0 8px 10px -5px ${LIGHT_TRANSPARENT}, 0 16px 24px 2px ${DARK_TRANSPARENT}, 0 6px 30px 5px ${DARKER_TRANSPARENT}`,
  `0 8px 11px -5px ${LIGHT_TRANSPARENT}, 0 17px 26px 2px ${DARK_TRANSPARENT}, 0 6px 32px 5px ${DARKER_TRANSPARENT}`,
  `0 9px 11px -5px ${LIGHT_TRANSPARENT}, 0 18px 28px 2px ${DARK_TRANSPARENT}, 0 7px 34px 6px ${DARKER_TRANSPARENT}`,
  `0 9px 12px -6px ${LIGHT_TRANSPARENT}, 0 19px 29px 2px ${DARK_TRANSPARENT}, 0 7px 36px 6px ${DARKER_TRANSPARENT}`,
  `0 10px 13px -6px ${LIGHT_TRANSPARENT}, 0 20px 31px 3px ${DARK_TRANSPARENT}, 0 8px 38px 7px ${DARKER_TRANSPARENT}`,
  `0 10px 13px -6px ${LIGHT_TRANSPARENT}, 0 21px 33px 3px ${DARK_TRANSPARENT}, 0 8px 40px 7px ${DARKER_TRANSPARENT}`,
  `0 10px 14px -6px ${LIGHT_TRANSPARENT}, 0 22px 35px 3px ${DARK_TRANSPARENT}, 0 8px 42px 7px ${DARKER_TRANSPARENT}`,
  `0 11px 14px -7px ${LIGHT_TRANSPARENT}, 0 23px 36px 3px ${DARK_TRANSPARENT}, 0 9px 44px 8px ${DARKER_TRANSPARENT}`,
  `0 11px 15px -7px ${LIGHT_TRANSPARENT}, 0 24px 38px 3px ${DARK_TRANSPARENT}, 0 9px 46px 8px ${DARKER_TRANSPARENT}`,
];

export const customShadows = {
  z1: `0 1px 2px 0 ${LIGHT_TRANSPARENT}`,
  z8: `0 8px 16px 0 ${LIGHT_TRANSPARENT}`,
  z12: `0 0 2px 0 rgba(${LIGHT_MODE}, 0.12), 0 12px 24px -4px rgba(${LIGHT_MODE}, 0.12)`,
  z16: `0 0 2px 0 rgba(${LIGHT_MODE}, 0.16), 0 16px 32px -4px rgba(${LIGHT_MODE}, 0.16)`,
  z20: `0 0 2px 0 rgba(${LIGHT_MODE}, 0.2), 0 20px 40px -4px rgba(${LIGHT_MODE}, 0.2)`,
  z24: `0 0 4px 0 rgba(${LIGHT_MODE}, 0.24), 0 24px 48px 0 rgba(${LIGHT_MODE}, 0.24)`,
  primary: `0 8px 16px 0 ${primary.main}33`,
  card: `0 0 2px 0 rgba(${LIGHT_MODE}, 0.2), 0 12px 24px -4px rgba(${LIGHT_MODE}, 0.12)`,
  dialog: `-40px 40px 80px -8px rgba(0,0,0,0.24)`,
  dropdown: `0 0 2px 0 rgba(${LIGHT_MODE}, 0.24), -20px 20px 40px -4px rgba(${LIGHT_MODE}, 0.24)`,
};

export default shadows;
