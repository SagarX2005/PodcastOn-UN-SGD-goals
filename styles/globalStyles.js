import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Theme Colors
export const colors = {
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  primaryLight: '#42A5F5',
  secondary: '#26A69A',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#bdc3c7',
  border: '#e1e5e9',
  borderDark: '#d5dbdb',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  shadow: 'rgba(30, 136, 229, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.1)',
};

// Typography
export const typography = {
  headerLarge: { fontSize: 28, fontWeight: 'bold', color: colors.text, lineHeight: 34 },
  headerMedium: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  headerSmall: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  bodyLarge: { fontSize: 18, color: colors.text, lineHeight: 24 },
  bodyMedium: { fontSize: 16, color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.textLight },
  button: { fontSize: 16, fontWeight: '600', color: colors.surface },
};

// Spacing
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

// Border Radius
export const borderRadius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// Shadows
export const shadows = {
  small: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  medium: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  large: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  primaryShadow: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
};

// Global Styles
export const globalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeContainer: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  scrollContainer: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  headerCard: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryDark,
    ...shadows.large,
    shadowColor: colors.primary,
  },
  headerTitle: {
    ...typography.headerMedium,
    color: colors.surface,
    textAlign: 'center',
    textShadowColor: colors.primaryDark,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  contentCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadows.medium },
  elevatedCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginVertical: spacing.sm, borderWidth: 2, borderColor: colors.border, ...shadows.large },

  primaryButton: { backgroundColor: colors.primary, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.primaryDark, ...shadows.primaryShadow },
  primaryButtonText: { ...typography.button, fontSize: 18, fontWeight: '700', textAlign: 'center', textShadowColor: colors.primaryDark, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.primary },
  secondaryButtonText: { ...typography.button, color: colors.primary, textAlign: 'center', fontWeight: '600' },
  outlineButton: { backgroundColor: colors.surface, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, ...shadows.small },
  outlineButtonText: { ...typography.button, color: colors.text, textAlign: 'center', fontWeight: '500' },

  // TextInput
  textInput: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2, fontSize: 16, color: colors.text, ...shadows.small },
  textInputFocused: { borderColor: colors.primary, ...shadows.medium },

  // **NEW: Transparent TextInput**
  textInputTransparent: {
    backgroundColor: 'transparent',  // fully transparent
    borderWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
    color: colors.text,
  },

  inputLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  inputContainer: { marginVertical: spacing.sm },

  // Rest of your styles remain unchanged...
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  mt_xs: { marginTop: spacing.xs }, mt_sm: { marginTop: spacing.sm }, mt_md: { marginTop: spacing.md }, mt_lg: { marginTop: spacing.lg }, mt_xl: { marginTop: spacing.xl },
  mb_xs: { marginBottom: spacing.xs }, mb_sm: { marginBottom: spacing.sm }, mb_md: { marginBottom: spacing.md }, mb_lg: { marginBottom: spacing.lg }, mb_xl: { marginBottom: spacing.xl },
  p_xs: { padding: spacing.xs }, p_sm: { padding: spacing.sm }, p_md: { padding: spacing.md }, p_lg: { padding: spacing.lg }, p_xl: { padding: spacing.xl },
  ph_md: { paddingHorizontal: spacing.md }, ph_lg: { paddingHorizontal: spacing.lg },
  pv_md: { paddingVertical: spacing.md }, pv_lg: { paddingVertical: spacing.lg },
});

export default globalStyles;
