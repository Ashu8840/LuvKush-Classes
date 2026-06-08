import React from "react";
import { TouchableOpacity, View } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppDrawerContent, STUDENT_NAV } from "../components/layout/DrawerContent";
import { ThemeSelector } from "../components/layout/ThemeSelector";
import { NotificationBell } from "../components/layout/NotificationBell";
import { AppRefreshButton } from "../components/layout/AppRefreshButton";
import { useTheme } from "../contexts/ThemeContext";
import StudentDashboardScreen from "../screens/student/DashboardScreen";
import StudentCoursesScreen from "../screens/student/CoursesScreen";
import StudentTypingScreen from "../screens/student/TypingScreen";
import StudentShorthandScreen from "../screens/student/ShorthandScreen";
import StudentExamsScreen from "../screens/student/ExamsScreen";
import StudentFeesScreen from "../screens/student/FeesScreen";
import StudentLibraryScreen from "../screens/student/LibraryScreen";
import StudentCertificatesScreen from "../screens/student/CertificatesScreen";
import StudentAICoachScreen from "../screens/student/AICoachScreen";
import StudentLeaderboardScreen from "../screens/student/LeaderboardScreen";
import StudentAnalyticsScreen from "../screens/student/AnalyticsScreen";
import StudentProfileScreen from "../screens/student/ProfileScreen";
import StudentAnnouncementsScreen from "../screens/student/AnnouncementsScreen";
import StudentFeedbackScreen from "../screens/student/FeedbackScreen";
import StudentLiveClassesScreen from "../screens/student/LiveClassesScreen";
import LiveClassRoomScreen from "../screens/shared/LiveClassRoomScreen";
import ExamTakeScreen from "../screens/student/ExamTakeScreen";
import ExamResultsScreen from "../screens/student/ExamResultsScreen";
import MaterialViewerScreen from "../screens/shared/MaterialViewerScreen";
import CertificateViewScreen from "../screens/shared/CertificateViewScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const drawerScreens: Record<string, React.ComponentType> = {
  StudentDashboard: StudentDashboardScreen,
  StudentCourses: StudentCoursesScreen,
  StudentAnnouncements: StudentAnnouncementsScreen,
  StudentTyping: StudentTypingScreen,
  StudentShorthand: StudentShorthandScreen,
  StudentLiveClasses: StudentLiveClassesScreen,
  StudentExams: StudentExamsScreen,
  StudentLeaderboard: StudentLeaderboardScreen,
  StudentAnalytics: StudentAnalyticsScreen,
  StudentFees: StudentFeesScreen,
  StudentLibrary: StudentLibraryScreen,
  StudentCertificates: StudentCertificatesScreen,
  StudentAICoach: StudentAICoachScreen,
  StudentFeedback: StudentFeedbackScreen,
};

function StudentDrawer() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} role="student" />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        drawerStyle: { backgroundColor: colors.card, width: 260 },
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
      {STUDENT_NAV.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={drawerScreens[item.name]}
          options={{
            title: item.label,
            drawerIcon: ({ color, size }) => (
              <Ionicons name={item.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
      <Drawer.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{
          title: "My Profile",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
  );
}

export default function StudentNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="StudentDrawer" component={StudentDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="StudentExamTake" component={ExamTakeScreen} options={{ title: "Take Exam" }} />
      <Stack.Screen name="StudentExamResults" component={ExamResultsScreen} options={{ title: "Exam Results" }} />
      <Stack.Screen name="LiveClassRoom" component={LiveClassRoomScreen} options={{ title: "Live Class" }} />
      <Stack.Screen name="MaterialViewer" component={MaterialViewerScreen} options={{ title: "Reader" }} />
      <Stack.Screen name="CertificateView" component={CertificateViewScreen} options={{ title: "Certificate" }} />
    </Stack.Navigator>
  );
}

export type StudentStackParamList = {
  StudentDrawer: undefined;
  StudentExamTake: { examId: string };
  StudentExamResults: { examId: string };
  LiveClassRoom: { classId: string; isTeacher?: boolean };
  MaterialViewer: { item: import("../lib/api").LibraryItem };
  CertificateView: { certificateId: string };
};