import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab({ style, ...props }: BottomTabBarButtonProps) {
  // Extract pointerEvents from props if it exists to avoid the deprecation warning
  // when passed as a direct prop to PlatformPressable
  const { pointerEvents, ...rest } = props as any;

  return (
    <PlatformPressable
      {...rest}
      style={[style, pointerEvents ? { pointerEvents } : null]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
