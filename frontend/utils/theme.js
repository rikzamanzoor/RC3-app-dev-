// Design tokens matching Stitch project: Shared Living Expense Tracker
export const theme = {
  colors: {
    primary: '#ae3104',
    primaryContainer: '#ff6a3d',
    primaryFixed: '#ffdbd1',
    primaryFixedDim: '#ffb59f',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#611600',
    onPrimaryFixedVariant: '#862200',

    secondary: '#775a00',
    secondaryContainer: '#fdc731',
    secondaryFixed: '#ffdf98',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#6f5400',
    onSecondaryFixedVariant: '#5a4300',

    background: '#fff8f5',
    surface: '#fff8f5',
    surfaceLowest: '#ffffff',
    surfaceLow: '#fcf1ec',
    surfaceContainer: '#f7ece7',
    surfaceHigh: '#f1e6e1',
    surfaceHighest: '#ebe0db',

    onBackground: '#1f1b18',
    onSurface: '#1f1b18',
    onSurfaceVariant: '#59413a',
    tertiary: '#6b5b54',
    tertiaryContainer: '#a8968d',
    onTertiary: '#ffffff',

    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',

    success: '#1b5e20',
    successContainer: '#d7eedb',
    onSuccess: '#ffffff',

    outline: '#8d7169',
    outlineVariant: '#e1bfb6',
    border: '#ebe0db',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  typography: {
    display: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
    headlineLg: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
    headlineMd: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
    titleSm: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
    bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
    labelLg: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
    labelSm: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
    currency: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
  },

  shadows: {
    sm: {
      shadowColor: '#6b5b54',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#6b5b54',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    primaryGlow: {
      shadowColor: '#ff6a3d',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

