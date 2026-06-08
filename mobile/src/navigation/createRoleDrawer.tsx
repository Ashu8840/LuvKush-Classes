import React from "react";
import { TouchableOpacity, View } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { AppDrawerContent, NavItem } from "../components/layout/DrawerContent";
import { ThemeSelector } from "../components/layout/ThemeSelector";
import { NotificationBell } from "../components/layout/NotificationBell";
import { useTheme } from "../contexts/ThemeContext";
import { UserRole } from "../lib/api";

export function createRoleDrawer(
  role: UserRole,
  nav: NavItem[],
  screens: Record<string, React.ComponentType>,
  hiddenScreens?: Record<string, React.ComponentType>
) {
  const Drawer = createDrawerNavigator();

  function HeaderRight() {
    return (
      <>
        <NotificationBell />
        <ThemeSelector />
      </>
    );
  }

  return function RoleNavigator() {
    const { colors } = useTheme();

    return (
      <Drawer.Navigator
        drawerContent={(props) => <AppDrawerContent {...props} role={role} />}
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          drawerStyle: { backgroundColor: colors.card, width: 256 },
          drawerActiveTintColor: colors.accent,
          drawerInactiveTintColor: colors.muted,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 16 }}>
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ marginRight: 16, flexDirection: "row", gap: 8, alignItems: "center" }}>
              <HeaderRight />
            </View>
          ),
        })}
      >
        {nav.map((item) => (
          <Drawer.Screen
            key={item.name}
            name={item.name}
            component={screens[item.name]}
            options={{ title: item.label, drawerIcon: ({ color, size }) => (
              <Ionicons name={item.icon} size={size} color={color} />
            ) }}
          />
        ))}
        {hiddenScreens &&
          Object.entries(hiddenScreens).map(([name, Component]) => (
            <Drawer.Screen
              key={name}
              name={name}
              component={Component}
              options={{
                title: "My Profile",
                drawerItemStyle: { display: "none" },
              }}
            />
          ))}
      </Drawer.Navigator>
    );
  };
}