import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Couleurs alignées au design Tournee (dark glass)
  const GLASS_BG = 'rgba(255,255,255,0.06)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const INACTIVE = 'rgba(255,255,255,0.55)';
  const ACTIVE = theme.tint ?? '#4F8CFF';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: theme.tabIconDefault ?? INACTIVE,

        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Platform.OS === 'ios' ? 24 : 14,
          height: 66,
          borderRadius: 24,

          // Glass style
          backgroundColor: theme.card ?? GLASS_BG,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: GLASS_BORDER,

          // Shadow/Elevation
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,

          // Android optimization
          ...(Platform.OS === 'android'
            ? {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              height: 70,
            }
            : null),
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -4,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
          textAlign: 'center',
        },

        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="tournee"
        options={{
          title: 'Tournée',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 24 : 22}
              name="shippingbox.fill"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="carte"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 24 : 22}
              name="map.fill"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={focused ? 28 : 26}
              name="qrcode.viewfinder"
              color={focused ? '#FFFFFF' : ACTIVE}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            marginTop: -4,
            marginBottom: Platform.OS === 'android' ? 4 : 0,
            textAlign: 'center',
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: ACTIVE,
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected;
            return (
              <HapticTab
                {...props}
                style={[
                  props.style,
                  isFocused && {
                    backgroundColor: 'rgba(79,140,255,0.22)',
                    borderRadius: 16,
                    marginHorizontal: 4,
                    marginVertical: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(79,140,255,0.45)',
                  },
                ]}
              />
            );
          },
        }}
      />

      <Tabs.Screen
        name="performance"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 24 : 22}
              name="chart.bar.fill"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 24 : 22}
              name="person.crop.circle.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}