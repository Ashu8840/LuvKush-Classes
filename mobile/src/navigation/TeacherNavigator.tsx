import React from "react";
import { TouchableOpacity, View } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppDrawerContent, TEACHER_NAV } from "../components/layout/DrawerContent";
import { ThemeSelector } from "../components/layout/ThemeSelector";
import { NotificationBell } from "../components/layout/NotificationBell";
import { AppRefreshButton } from "../components/layout/AppRefreshButton";
import { useTheme } from "../contexts/ThemeContext";
import TeacherDashboardScreen from "../screens/teacher/DashboardScreen";
import TeacherStudentsScreen from "../screens/teacher/StudentsScreen";
import TeacherAttendanceScreen from "../screens/teacher/AttendanceScreen";
import TeacherClassesScreen from "../screens/teacher/ClassesScreen";
import TeacherExamsScreen from "../screens/teacher/ExamsScreen";
import TeacherMaterialsScreen from "../screens/teacher/MaterialsScreen";
import TeacherLearningModulesScreen from "../screens/teacher/LearningModulesScreen";
import TeacherShorthandScreen from "../screens/teacher/ShorthandScreen";
import TypingLibraryScreen from "../screens/shared/TypingLibraryScreen";
import TeacherProfileScreen from "../screens/teacher/ProfileScreen";
import TeacherAnnouncementsScreen from "../screens/teacher/AnnouncementsScreen";
import LiveClassRoomScreen from "../screens/shared/LiveClassRoomScreen";
import MaterialViewerScreen from "../screens/shared/MaterialViewerScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const drawerScreens: Record<string, React.ComponentType> = {
  TeacherDashboard: TeacherDashboardScreen,
  TeacherStudents: TeacherStudentsScreen,
  TeacherAttendance: TeacherAttendanceScreen,
  TeacherClasses: TeacherClassesScreen,
  TeacherExams: TeacherExamsScreen,
  TeacherShorthand: TeacherShorthandScreen,
  TeacherTypingLibrary: TypingLibraryScreen,
  TeacherAnnouncements: TeacherAnnouncementsScreen,
  TeacherMaterials: TeacherMaterialsScreen,
  TeacherLearningModules: TeacherLearningModulesScreen,
};

function TeacherDrawer() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} role="teacher" />}
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
            <AppRefreshButton />
            <NotificationBell />
            <ThemeSelector />
          </View>
        ),
      })}
    >
      {TEACHER_NAV.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={drawerScreens[item.name]}
          options={{
            title: item.label,
            drawerIcon: ({ color, size }) => <Ionicons name={item.icon} size={size} color={color} />,
          }}
        />
      ))}
      <Drawer.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{ title: "My Profile", drawerItemStyle: { display: "none" } }}
      />
    </Drawer.Navigator>
  );
}

export type TeacherStackParamList = {
  TeacherDrawer: undefined;
  LiveClassRoom: { classId: string; isTeacher?: boolean };
  MaterialViewer: { item: import("../lib/api").LibraryItem };
};

export default function TeacherNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="TeacherDrawer" component={TeacherDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="LiveClassRoom" component={LiveClassRoomScreen} options={{ title: "Live Class Room" }} />
      <Stack.Screen name="MaterialViewer" component={MaterialViewerScreen} options={{ title: "Reader" }} />
    </Stack.Navigator>
  );
}