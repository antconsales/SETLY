import * as Haptics from 'expo-haptics';

export const haptics = {
  // Button tap
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Light tap for selections
  select: () => Haptics.selectionAsync(),

  // Light impact
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Heavy impact for important actions
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Success notification (set complete)
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // Warning notification (rest complete)
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  // Error notification
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

export default haptics;
