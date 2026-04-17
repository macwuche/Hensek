import { Switch, Route, Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Auth pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// MD pages
import MDOverview from "@/pages/md";
import MDStaff from "@/pages/md/Staff";
import MDDepartments from "@/pages/md/Departments";
import MDApplications from "@/pages/md/Applications";
import MDReports from "@/pages/md/Reports";
import MDSettings from "@/pages/md/Settings";

// HR pages
import HROverview from "@/pages/hr";
import HRStaff from "@/pages/hr/Staff";
import HRApplications from "@/pages/hr/Applications";
import HRApprovals from "@/pages/hr/Approvals";
import HRAnnouncements from "@/pages/hr/Announcements";
import HRDepartments from "@/pages/hr/Departments";

// Safety pages
import SafetyOverview from "@/pages/safety";
import SafetyMap from "@/pages/safety/Map";
import SafetyDuties from "@/pages/safety/Duties";
import SafetySites from "@/pages/safety/Sites";
import SafetyAttendance from "@/pages/safety/Attendance";
import SafetyReports from "@/pages/safety/Reports";

// Security pages
import SecurityOverview from "@/pages/security";
import SecurityVisitors from "@/pages/security/Visitors";
import SecurityStaff from "@/pages/security/Staff";
import SecurityReports from "@/pages/security/Reports";

// Staff pages
import StaffOverview from "@/pages/staff";
import StaffDuties from "@/pages/staff/Duties";
import StaffApplications from "@/pages/staff/Applications";
import StaffMessages from "@/pages/staff/Messages";
import StaffProfile from "@/pages/staff/Profile";
import Notifications from "@/pages/Notifications";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 55%, #FEF9C3 100%)" }}>
        <div className="w-8 h-8 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Redirect to={getDashboardPath(user.role, user.departmentSlug)} />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 55%, #FEF9C3 100%)" }}>
        <div className="w-8 h-8 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  return <Redirect to={getDashboardPath(user.role, user.departmentSlug)} />;
}

export default function App() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* MD routes */}
      <Route path="/md">
        <ProtectedRoute roles={["md"]}><MDOverview /></ProtectedRoute>
      </Route>
      <Route path="/md/staff">
        <ProtectedRoute roles={["md"]}><MDStaff /></ProtectedRoute>
      </Route>
      <Route path="/md/departments">
        <ProtectedRoute roles={["md"]}><MDDepartments /></ProtectedRoute>
      </Route>
      <Route path="/md/applications">
        <ProtectedRoute roles={["md"]}><MDApplications /></ProtectedRoute>
      </Route>
      <Route path="/md/reports">
        <ProtectedRoute roles={["md"]}><MDReports /></ProtectedRoute>
      </Route>
      <Route path="/md/settings">
        <ProtectedRoute roles={["md"]}><MDSettings /></ProtectedRoute>
      </Route>

      {/* HR routes */}
      <Route path="/hr">
        <ProtectedRoute roles={["hr"]}><HROverview /></ProtectedRoute>
      </Route>
      <Route path="/hr/staff">
        <ProtectedRoute roles={["hr"]}><HRStaff /></ProtectedRoute>
      </Route>
      <Route path="/hr/applications">
        <ProtectedRoute roles={["hr"]}><HRApplications /></ProtectedRoute>
      </Route>
      <Route path="/hr/approvals">
        <ProtectedRoute roles={["hr"]}><HRApprovals /></ProtectedRoute>
      </Route>
      <Route path="/hr/announcements">
        <ProtectedRoute roles={["hr"]}><HRAnnouncements /></ProtectedRoute>
      </Route>
      <Route path="/hr/departments">
        <ProtectedRoute roles={["hr"]}><HRDepartments /></ProtectedRoute>
      </Route>

      {/* Safety routes */}
      <Route path="/safety">
        <ProtectedRoute roles={["safety"]}><SafetyOverview /></ProtectedRoute>
      </Route>
      <Route path="/safety/map">
        <ProtectedRoute roles={["safety"]}><SafetyMap /></ProtectedRoute>
      </Route>
      <Route path="/safety/duties">
        <ProtectedRoute roles={["safety"]}><SafetyDuties /></ProtectedRoute>
      </Route>
      <Route path="/safety/sites">
        <ProtectedRoute roles={["safety"]}><SafetySites /></ProtectedRoute>
      </Route>
      <Route path="/safety/attendance">
        <ProtectedRoute roles={["safety"]}><SafetyAttendance /></ProtectedRoute>
      </Route>
      <Route path="/safety/reports">
        <ProtectedRoute roles={["safety"]}><SafetyReports /></ProtectedRoute>
      </Route>

      {/* Security routes */}
      <Route path="/security">
        <ProtectedRoute roles={["security"]}><SecurityOverview /></ProtectedRoute>
      </Route>
      <Route path="/security/visitors">
        <ProtectedRoute roles={["security"]}><SecurityVisitors /></ProtectedRoute>
      </Route>
      <Route path="/security/staff">
        <ProtectedRoute roles={["security"]}><SecurityStaff /></ProtectedRoute>
      </Route>
      <Route path="/security/reports">
        <ProtectedRoute roles={["security"]}><SecurityReports /></ProtectedRoute>
      </Route>

      {/* Staff routes — dynamic dept slug */}
      <Route path="/:dept/notifications">
        {(params) => (
          <ProtectedRoute><Notifications /></ProtectedRoute>
        )}
      </Route>
      <Route path="/:dept/duties">
        {(params) => (
          <ProtectedRoute roles={["staff"]}><StaffDuties /></ProtectedRoute>
        )}
      </Route>
      <Route path="/:dept/applications">
        {(params) => (
          <ProtectedRoute roles={["staff"]}><StaffApplications /></ProtectedRoute>
        )}
      </Route>
      <Route path="/:dept/messages">
        {(params) => (
          <ProtectedRoute roles={["staff"]}><StaffMessages /></ProtectedRoute>
        )}
      </Route>
      <Route path="/:dept/profile">
        {(params) => (
          <ProtectedRoute><StaffProfile /></ProtectedRoute>
        )}
      </Route>
      <Route path="/:dept">
        {(params) => (
          <ProtectedRoute roles={["staff"]}><StaffOverview /></ProtectedRoute>
        )}
      </Route>

      {/* Root redirect */}
      <Route path="/" component={RootRedirect} />
      <Route component={RootRedirect} />
    </Switch>
  );
}
