import { ThemeConfig } from 'antd/lib';
import { PRIMARY_COLOR } from '../../style.config';
import Color from 'color';

const primaryColor = Color(PRIMARY_COLOR);
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY_COLOR,
  },
  components: {
    Tree: {
      nodeSelectedBg: primaryColor.isLight()
        ? primaryColor.toString()
        : primaryColor.lightness(90).toString(),
    },
    Input: {
      paddingBlock: 8,
    },
    Button: {
      fontWeight: 700,
      paddingBlock: 20,
      paddingInline: 20,
      primaryShadow: 'none',
      borderRadius: 8,
      borderRadiusSM: 8,
      borderRadiusLG: 12,
      borderRadiusXS: 4,
    },
    Modal: {
      titleFontSize: 24,
    },
  },
};
