import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  House,
  ShoppingBag,
  User,
} from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: false,

        tabBarButton: HapticTab,

        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,

          height: 75,

          borderRadius: 24,

          backgroundColor: isDark ? '#111827' : '#ffffff',

          borderTopWidth: 0,

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.12,
          shadowRadius: 20,

          elevation: 10,

          paddingHorizontal: 10,
        },

        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <House
                size={24}
                color={focused ? '#2563eb' : color}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="order"
        options={{
          title: 'Order',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <ShoppingBag
                size={24}
                color={focused ? '#2563eb' : color}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <User
                size={24}
                color={focused ? '#2563eb' : color}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeIconContainer: {
    backgroundColor: '#dbeafe',
  },
});