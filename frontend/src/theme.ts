import type { ThemeConfig } from 'antd';

/**
 * Ant Design 5 主题覆写 — 温润儒雅 · 钢蓝 accent
 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#4f6d8c',
    colorPrimaryHover: '#5f80a2',
    colorPrimaryActive: '#3d5870',
    colorPrimaryBg: '#eaf0f6',
    colorPrimaryBgHover: '#d5e1ed',
    colorPrimaryBorder: '#a3bdd4',
    colorPrimaryBorderHover: '#8eaec9',
    colorPrimaryText: '#4f6d8c',
    colorPrimaryTextHover: '#5f80a2',
    colorPrimaryTextActive: '#3d5870',

    colorBgBase: '#fefdfb',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f3ef',
    colorBgSpotlight: '#ffffff',
    colorBgMask: 'rgba(26, 24, 21, 0.4)',

    colorTextBase: '#1a1815',
    colorTextSecondary: '#6e6a63',
    colorTextTertiary: '#a39e96',
    colorTextQuaternary: '#c5bfb6',

    colorBorder: '#e5e0d8',
    colorBorderSecondary: '#d4cec5',

    colorSuccess: '#22c55e',
    colorWarning: '#eab308',
    colorError: '#ef4444',
    colorInfo: '#4f6d8c',

    colorFillSecondary: '#f5f3ef',
    colorFillTertiary: '#eae6df',
    colorFillQuaternary: '#e5e0d8',

    fontFamily: `'DM Sans', 'Inter', system-ui, -apple-system, sans-serif`,
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 17,
    lineHeight: 1.65,

    borderRadius: 10,
    borderRadiusLG: 16,
    borderRadiusSM: 6,

    motionDurationSlow: '0.4s',
    motionDurationMid: '0.24s',
    motionDurationFast: '0.16s',

    padding: 16,
    paddingLG: 24,
    margin: 16,
    marginLG: 24,

    boxShadow: '0 2px 10px rgba(26,24,21,0.05)',
    boxShadowSecondary: '0 8px 28px rgba(26,24,21,0.08)',
  },

  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      paddingContentHorizontal: 24,
      fontWeight: 600,
      primaryShadow: '0 2px 10px rgba(79,109,140,0.25)',
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
      colorBgContainer: '#ffffff',
    },
    Table: {
      headerBg: '#f5f3ef',
      headerColor: '#1a1815',
      rowHoverBg: '#f5f3ef',
      borderColor: '#e5e0d8',
      colorBgContainer: '#ffffff',
    },
    Modal: {
      borderRadiusLG: 16,
      titleFontSize: 18,
      colorBgElevated: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#eaf0f6',
      itemSelectedColor: '#4f6d8c',
      itemColor: '#6e6a63',
      itemHoverColor: '#1a1815',
      itemHoverBg: '#f5f3ef',
      subMenuItemBg: 'transparent',
    },
    Input: {
      activeBorderColor: '#4f6d8c',
      hoverBorderColor: '#a3bdd4',
      colorBgContainer: '#ffffff',
      colorBorder: '#e5e0d8',
      borderRadius: 10,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#e5e0d8',
      optionSelectedBg: '#eaf0f6',
      optionSelectedColor: '#4f6d8c',
    },
    Segmented: {
      itemSelectedBg: '#eaf0f6',
      itemSelectedColor: '#4f6d8c',
      trackBg: '#f5f3ef',
    },
    Progress: {
      defaultColor: '#4f6d8c',
      remainingColor: '#e5e0d8',
    },
    Tag: { defaultBg: '#f5f3ef', defaultColor: '#6e6a63' },
    Dropdown: { colorBgElevated: '#ffffff' },
    Tooltip: { colorBgSpotlight: '#1a1815', colorTextLightSolid: '#ffffff' },
    Badge: { colorError: '#ef4444' },
    Breadcrumb: {
      itemColor: '#a39e96',
      lastItemColor: '#6e6a63',
      linkColor: '#a39e96',
      linkHoverColor: '#4f6d8c',
    },
    Layout: {
      bodyBg: '#f5f3ef',
      headerBg: '#fefdfb',
      siderBg: '#fefdfb',
      triggerBg: '#f5f3ef',
      triggerColor: '#6e6a63',
    },
  },
};
