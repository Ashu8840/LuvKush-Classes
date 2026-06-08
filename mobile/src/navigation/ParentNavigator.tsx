import { createRoleDrawer } from "./createRoleDrawer";
import { PARENT_NAV } from "../components/layout/DrawerContent";
import ParentDashboardScreen from "../screens/parent/DashboardScreen";
import ParentAttendanceScreen from "../screens/parent/AttendanceScreen";
import ParentFeesScreen from "../screens/parent/FeesScreen";
import ParentProgressScreen from "../screens/parent/ProgressScreen";
import ParentCertificatesScreen from "../screens/parent/CertificatesScreen";

const screens = {
  ParentDashboard: ParentDashboardScreen,
  ParentAttendance: ParentAttendanceScreen,
  ParentFees: ParentFeesScreen,
  ParentProgress: ParentProgressScreen,
  ParentCertificates: ParentCertificatesScreen,
};

export default createRoleDrawer("parent", PARENT_NAV, screens);