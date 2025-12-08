import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import StudentHome from './pages/StudentHome.jsx'; // Now acts as "My Courses"
import AdminHome from './pages/AdminHome.jsx'; // Admin/Staff landing page
import AdminCourseManager from './pages/AdminCourseManager.jsx';
import CourseCatalog from './pages/CourseCatalog.jsx';
import CatalogCourseDetails from './pages/CatalogCourseDetails.jsx';
import CourseDetails from './components/CourseDetails.jsx'; // View for enrolled course
import { authService } from './services/authService.js';
import GradebookPage from './pages/GradebookPage.jsx';
import AssessmentCreationPage from './pages/AssessmentCreationPage.jsx';
import MyGradesPage from './pages/MyGradesPage.jsx';
import ApplicationListPage from './pages/ApplicationListPage.jsx';
import ApplicationReviewPage from './pages/ApplicationReviewPage.jsx';
import TranscriptRequestsPage from './pages/TranscriptRequestsPage.jsx';
import ViewTranscriptPage from './pages/ViewTranscriptPage.jsx';
import RoomBookingPage from './pages/RoomBookingPage.jsx';
import AdminRoomManager from './pages/AdminRoomManager.jsx';
import AdminLabStationManager from './pages/AdminLabStationManager.jsx';
import StaffTranscriptManagementPage from './pages/StaffTranscriptManagementPage.jsx';
import StudentRecordSearchPage from './pages/StudentRecordSearchPage.jsx';
import StudentRecordSummaryPage from './pages/StudentRecordSummaryPage.jsx';
import LabStationBookingPage from './pages/LabStationBookingPage.jsx';
import AdmissionsInfoPage from './pages/AdmissionsInfoPage.jsx';
import ApplicationFormPage from './pages/ApplicationFormPage.jsx';
import ApplicationConfirmationPage from './pages/ApplicationConfirmationPage.jsx';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
    const isAuthenticated = authService.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Staff Only Route Component
 * Redirects to home if user is not staff
 */
function StaffOnlyRoute({ children }) {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const user = authService.getCurrentUser();
    if (user?.role !== 'staff') {
        return <Navigate to="/admin/home" replace />;
    }

    return children;
}

/**
 * Root Redirect Component
 * Redirects based on authentication status and user role
 * - Admin/Staff -> /admin/home
 * - Student -> /home
 * - Not authenticated -> /login
 */
function RootRedirect() {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    return <Navigate to={isAdminOrStaff ? "/admin/home" : "/home"} replace />;
}

/**
 * Main App Component with Routing
 */
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admissions" element={<AdmissionsInfoPage />} />
                <Route path="/apply" element={<ApplicationFormPage />} />
                <Route path="/apply/confirmation/:id" element={<ApplicationConfirmationPage />} />

                {/* Protected Routes */}

                {/* Student Home / Dashboard (My Courses) */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <StudentHome />
                        </ProtectedRoute>
                    }
                />

                {/* Course Catalog (Browsing new courses) */}
                <Route
                    path="/courses"
                    element={
                        <ProtectedRoute>
                            <CourseCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/catalog"
                    element={
                        <ProtectedRoute>
                            <CourseCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/catalog/course/:id"
                    element={
                        <ProtectedRoute>
                            <CatalogCourseDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/home"
                    element={
                        <ProtectedRoute>
                            <AdminHome />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/courses"
                    element={
                        <ProtectedRoute>
                            <AdminCourseManager />
                        </ProtectedRoute>
                    }
                />
                {/* NEW ROUTE: Assessment Creation */}
                <Route
                    path="/admin/assessments/create"
                    element={
                        <ProtectedRoute>
                            <AssessmentCreationPage />
                        </ProtectedRoute>
                    }
                />

                {/* Application Review Routes - Staff/Professor only */}
                <Route
                    path="/admin/applications"
                    element={
                        <ProtectedRoute>
                            <ApplicationListPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/applications/:id/review"
                    element={
                        <ProtectedRoute>
                            <ApplicationReviewPage />
                        </ProtectedRoute>
                    }
                />


                {/* Gradebook for Admin/Staff */}
                <Route
                    path="/admin/gradebook"
                    element={
                        <ProtectedRoute>
                            <GradebookPage />
                        </ProtectedRoute>
                    }
                />

                {/* Staff Transcript Management */}
                <Route
                    path="/admin/transcript-requests"
                    element={
                        <ProtectedRoute>
                            <StaffTranscriptManagementPage />
                        </ProtectedRoute>
                    }
                />

                {/* Student Record Management */}
                <Route
                    path="/admin/student-records"
                    element={
                        <ProtectedRoute>
                            <StudentRecordSearchPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/student-records/:id/summary"
                    element={
                        <ProtectedRoute>
                            <StudentRecordSummaryPage />
                        </ProtectedRoute>
                    }
                />

                {/* Student Grades View */}
                <Route
                    path="/my-grades"
                    element={
                        <ProtectedRoute>
                            <MyGradesPage />
                        </ProtectedRoute>
                    }
                />

                {/* Enrolled Course Detail View */}
                <Route
                    path="/course/:id"
                    element={
                        <ProtectedRoute>
                            <CourseDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Room Booking */}
                <Route
                    path="/admin/room-booking"
                    element={
                        <ProtectedRoute>
                            <RoomBookingPage />
                        </ProtectedRoute>
                    }
                />

                {/* Room Management (Staff Only) */}
                <Route
                    path="/admin/rooms"
                    element={
                        <StaffOnlyRoute>
                            <AdminRoomManager />
                        </StaffOnlyRoute>
                    }
                />

                {/* Lab Station Management (Staff Only) */}
                <Route
                    path="/admin/rooms/:labId/stations"
                    element={
                        <StaffOnlyRoute>
                            <AdminLabStationManager />
                        </StaffOnlyRoute>
                    }
                />

                {/* Lab Station Booking (Students) */}
                <Route
                    path="/lab-stations"
                    element={
                        <ProtectedRoute>
                            <LabStationBookingPage />
                        </ProtectedRoute>
                    }
                />

                {/* Transcript Requests */}
                <Route
                    path="/transcript-requests"
                    element={
                        <ProtectedRoute>
                            <TranscriptRequestsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/transcript-requests/:id"
                    element={
                        <ProtectedRoute>
                            <ViewTranscriptPage />
                        </ProtectedRoute>
                    }
                />

                {/* Smart redirect based on authentication status */}
                <Route path="/" element={<RootRedirect />} />

                {/* Catch all - smart redirect */}
                <Route path="*" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;