import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentHome from './pages/StudentHome';
import AdminHome from './pages/AdminHome';
import AdminCourseManager from './pages/AdminCourseManager';
import TADashboard from './pages/TADashboard';
import CourseCatalog from './pages/CourseCatalog';
import CatalogCourseDetails from './pages/CatalogCourseDetails';
import CourseDetails from './components/CourseDetails.jsx';
import { authService } from './services/authService.js';
import GradebookPage from './pages/GradebookPage';
import AssessmentCreationPage from './pages/AssessmentCreationPage';
import MyGradesPage from './pages/MyGradesPage';
import ApplicationListPage from './pages/ApplicationListPage';
import ApplicationReviewPage from './pages/ApplicationReviewPage';
import TranscriptRequestsPage from './pages/TranscriptRequestsPage';
import ViewTranscriptPage from './pages/ViewTranscriptPage';
import RoomBookingPage from './pages/RoomBookingPage.jsx';
import AdminRoomManager from './pages/AdminRoomManager';
import AdminLabStationManager from './pages/AdminLabStationManager';
import StaffTranscriptManagementPage from './pages/StaffTranscriptManagementPage.jsx';
import StudentRecordSearchPage from './pages/StudentRecordSearchPage.jsx';
import StudentRecordSummaryPage from './pages/StudentRecordSummaryPage.jsx';
import StaffSemesterManagementPage from './pages/StaffSemesterManagementPage';
import LabStationBookingPage from './pages/LabStationBookingPage.jsx';
import MaintenanceTicketPage from './pages/ViewTicketsPage.jsx';
import AdminTicketsManager from "./pages/AdminTicketsPage";
import AllocateResources from './pages/AllocateResources';
import ProfessorResources from './pages/ProfessorResources';
import StudentResources from './pages/StudentResources';
import AdmissionsInfoPage from './pages/AdmissionsInfoPage';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ApplicationConfirmationPage from './pages/ApplicationConfirmationPage';
import StaffPDTrackingPage from './pages/StaffPDTrackingPage';
import ProfessorPDHistoryPage from './pages/ProfessorPDHistoryPage';
import StudentLayout from './components/StudentLayout';
import StaffDirectoryPage from './pages/StaffDirectoryPage';
import StaffProfileDetailPage from './pages/StaffProfileDetailPage';
import ProfessorOfficeHoursPage from './pages/ProfessorOfficeHoursPage';
import MessagesPage from './pages/MessagesPage';
import ParentHome from './pages/ParentHome';
import ParentLogin from './pages/ParentLogin';
import ParentInbox from './pages/ParentInbox';
import ProfessorMessagesPage from './pages/ProfessorMessagesPage';
import StaffPerformanceManagementPage from './pages/StaffPerformanceManagementPage';
import ProfessorPerformancePage from './pages/ProfessorPerformancePage';
import StaffPayrollPage from './pages/StaffPayrollPage';
import BenefitsPage from './pages/BenefitsPage';

/**
 * Protected Route Component
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Staff Only Route Component
 */
function StaffOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const user: any = authService.getCurrentUser();
  if (user?.role !== 'staff') {
    return <Navigate to="/admin/home" replace />;
  }

  return children;
}

/**
 * Academic Staff Route Component (Staff + Professor + TA)
 */
function AcademicStaffRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const user: any = authService.getCurrentUser();
  const allowedRoles = ['staff', 'professor', 'teaching_assistant'];

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

/**
 * Root Redirect Component
 */
function RootRedirect() {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const user: any = authService.getCurrentUser();

  if (user?.role === 'teaching_assistant') {
    return <Navigate to="/ta-dashboard" replace />;
  }

  if (user?.role === 'parent') {
    return <Navigate to="/parent/home" replace />;
  }

  const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

  return <Navigate to={isAdminOrStaff ? "/admin/home" : "/home"} replace />;
}

function MyResourcesPage() {
  const user: any = authService.getCurrentUser();

  if (!user) {
    // Not logged in: send to login
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'professor') {
    return <ProfessorResources />;
  } else if (user.role === 'student') {
    return (
      <StudentLayout>
        <StudentResources />
      </StudentLayout>
    );
  } else {
    // Staff/admin view: use allocation/management page
    return (
      <StaffOnlyRoute>
        <AllocateResources />
      </StaffOnlyRoute>
    );
  }
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/parent-login" element={<ParentLogin />} />

        {/* New Public/Admissions Routes from dev */}
        <Route path="/admissions" element={<AdmissionsInfoPage />} />
        <Route path="/apply" element={<ApplicationFormPage />} />
        <Route path="/apply/confirmation/:id" element={<ApplicationConfirmationPage />} />

        {/* Protected Student Routes wrapped in Layout */}
        <Route element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
          {/* Student Home / Dashboard (My Courses) */}
          <Route path="/home" element={<StudentHome />} />

          {/* Course Catalog (Browsing new courses) */}
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/catalog" element={<CourseCatalog />} />
          <Route path="/catalog/course/:id" element={<CatalogCourseDetails />} />

          {/* Student Grades View */}
          <Route path="/my-grades" element={<MyGradesPage />} />

          {/* Enrolled Course Detail View */}
          <Route path="/course/:id" element={<CourseDetails />} />

          {/* Transcript Requests (Student View) */}
          <Route path="/transcript-requests" element={<TranscriptRequestsPage />} />
          <Route path="/transcript-requests/:id" element={<ViewTranscriptPage />} />

          {/* Lab Station Booking (Students) */}
          <Route path="/lab-stations" element={<LabStationBookingPage />} />

          {/* Student Maintenance Tickets */}
          <Route path="/tickets" element={<MaintenanceTicketPage />} />

          {/* Student Messages */}
          <Route path="/messages" element={<MessagesPage />} />

          {/* Student routes inside StudentLayout */}
          <Route path="staff-directory" element={<StaffDirectoryPage />} />
          <Route path="staff-directory/:id" element={<StaffProfileDetailPage />} />
        </Route>

        {/* --- Admin/Staff Routes --- */}

        {/* Admin Dashboard */}
        <Route path="/admin/home" element={<ProtectedRoute><AdminHome /></ProtectedRoute>} />

        {/* Course Management (Admin) */}
        <Route path="/admin/courses" element={<StaffOnlyRoute><AdminCourseManager /></StaffOnlyRoute>} />

        {/* TA Dashboard */}
        <Route path="/ta-dashboard" element={<ProtectedRoute><TADashboard /></ProtectedRoute>} />

        {/* NEW ROUTE: Assessment Creation */}
        <Route path="/admin/assessments/create" element={<ProtectedRoute><AssessmentCreationPage /></ProtectedRoute>} />

        {/* Application Review Routes - Staff/Professor only */}
        <Route path="/admin/applications" element={<ProtectedRoute><ApplicationListPage /></ProtectedRoute>} />
        <Route path="/admin/applications/:id/review" element={<ProtectedRoute><ApplicationReviewPage /></ProtectedRoute>} />

        {/* Gradebook for Admin/Staff */}
        <Route path="/admin/gradebook" element={<ProtectedRoute><GradebookPage /></ProtectedRoute>} />

        {/* Staff Transcript Management */}
        <Route path="/admin/transcript-requests" element={<ProtectedRoute><StaffTranscriptManagementPage /></ProtectedRoute>} />

        {/* Student Record Management */}
        <Route path="/admin/student-records" element={<ProtectedRoute><StudentRecordSearchPage /></ProtectedRoute>} />
        <Route path="/admin/student-records/:id/summary" element={<ProtectedRoute><StudentRecordSummaryPage /></ProtectedRoute>} />

        {/* Professional Development Tracking (Staff) */}
        <Route path="/admin/pd-tracking" element={<StaffOnlyRoute><StaffPDTrackingPage /></StaffOnlyRoute>} />

        {/* Performance Management (Staff Only) */}
        <Route path="/admin/performance" element={<StaffOnlyRoute><StaffPerformanceManagementPage /></StaffOnlyRoute>} />

        {/* Semester Management (Staff Only) */}
        <Route path="/admin/semesters" element={<StaffOnlyRoute><StaffSemesterManagementPage /></StaffOnlyRoute>} />

        {/* Staff Payroll (Academic Staff Only) */}
        <Route path="/admin/payroll" element={<AcademicStaffRoute><StaffPayrollPage /></AcademicStaffRoute>} />
        <Route path="/admin/benefits" element={<AcademicStaffRoute><BenefitsPage /></AcademicStaffRoute>} />

        {/* My Performance (Professor) */}
        <Route path="/faculty/performance" element={<ProtectedRoute><ProfessorPerformancePage /></ProtectedRoute>} />

        {/* Professional Development History (Professor) */}
        <Route path="/faculty/pd-history" element={<ProtectedRoute><ProfessorPDHistoryPage /></ProtectedRoute>} />

        {/* Professor Office Hours (Professor) */}
        <Route
          path="/faculty/office-hours"
          element={
            <ProtectedRoute>
              <ProfessorOfficeHoursPage />
            </ProtectedRoute>
          }
        />

        {/* Professor Messages (unified inbox for both student and parent messages) */}
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute>
              <ProfessorMessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy route for backward compatibility */}
        <Route
          path="/faculty/parent-inbox"
          element={
            <Navigate to="/admin/messages" replace />
          }
        />

        {/* Legacy/Specific route aliases */}
        <Route path="/faculty/messages" element={<Navigate to="/admin/messages" replace />} />

        {/* Room Booking (Student/Staff access to page) */}
        <Route path="/admin/room-booking" element={<ProtectedRoute><RoomBookingPage /></ProtectedRoute>} />

        {/* Room Management (Staff Only) - Retaining StaffOnlyRoute where specified */}
        <Route path="/admin/rooms" element={<StaffOnlyRoute><AdminRoomManager /></StaffOnlyRoute>} />

        {/* Lab Station Management (Staff Only) - Retaining StaffOnlyRoute where specified */}
        <Route path="/admin/rooms/:labId/stations" element={<StaffOnlyRoute><AdminLabStationManager /></StaffOnlyRoute>} />

        {/* Admin Maintenance Tickets (Staff Only) - Retaining StaffOnlyRoute where specified */}
        <Route path="/admin/tickets" element={<StaffOnlyRoute><AdminTicketsManager /></StaffOnlyRoute>} />

        {/* Resources/Facilities Routes (from dev) */}
        <Route path="/facilities/allocate" element={<StaffOnlyRoute><AllocateResources /></StaffOnlyRoute>} />
        <Route path="/facilities/my-resources" element={<ProtectedRoute><MyResourcesPage /></ProtectedRoute>} />

        {/* Parent Routes */}
        <Route path="/parent/home" element={<ProtectedRoute><ParentHome /></ProtectedRoute>} />
        <Route path="/parent/inbox" element={<ProtectedRoute><ParentInbox /></ProtectedRoute>} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Staff Directory Page */}
        <Route path="/admin/staff-directory" element={<ProtectedRoute><StaffDirectoryPage /></ProtectedRoute>} />

        {/* Staff profile detail (Staff Only) */}
        <Route
          path="/admin/staff-directory/:id"
          element={
            <ProtectedRoute>
              <StaffProfileDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - smart redirect */}
        <Route path="*" element={<RootRedirect />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;