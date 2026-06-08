import { createRoleDrawer } from "./createRoleDrawer";
import { ADMIN_NAV } from "../components/layout/DrawerContent";
import AdminDashboardScreen from "../screens/admin/DashboardScreen";
import AdminStudentsScreen from "../screens/admin/StudentsScreen";
import AdminTeachersScreen from "../screens/admin/TeachersScreen";
import AdminCoursesScreen from "../screens/admin/CoursesScreen";
import AdminBatchesScreen from "../screens/admin/BatchesScreen";
import AdminAttendanceScreen from "../screens/admin/AttendanceScreen";
import AdminFeesScreen from "../screens/admin/FeesScreen";
import AdminExamsScreen from "../screens/admin/ExamsScreen";
import AdminReportsScreen from "../screens/admin/ReportsScreen";
import AdminDatabaseScreen from "../screens/admin/DatabaseScreen";
import TypingLibraryScreen from "../screens/shared/TypingLibraryScreen";
import AdminAnnouncementsScreen from "../screens/admin/AnnouncementsScreen";
import AdminStudentFeedbackScreen from "../screens/admin/StudentFeedbackScreen";
import AdminCertificationsScreen from "../screens/admin/CertificationsScreen";

const screens = {
  AdminDashboard: AdminDashboardScreen,
  AdminStudents: AdminStudentsScreen,
  AdminTeachers: AdminTeachersScreen,
  AdminCourses: AdminCoursesScreen,
  AdminBatches: AdminBatchesScreen,
  AdminAttendance: AdminAttendanceScreen,
  AdminFees: AdminFeesScreen,
  AdminExams: AdminExamsScreen,
  AdminCertifications: AdminCertificationsScreen,
  AdminTypingLibrary: TypingLibraryScreen,
  AdminAnnouncements: AdminAnnouncementsScreen,
  AdminStudentFeedback: AdminStudentFeedbackScreen,
  AdminReports: AdminReportsScreen,
  AdminDatabase: AdminDatabaseScreen,
};

export default createRoleDrawer("admin", ADMIN_NAV, screens);