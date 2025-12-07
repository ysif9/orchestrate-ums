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
import TranscriptRequestsPage from './pages/TranscriptRequestsPage.jsx';
import ViewTranscriptPage from './pages/ViewTranscriptPage.jsx';
import StaffTranscriptManagementPage from './pages/StaffTranscriptManagementPage.jsx';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
    const isAuthenticated = authService.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
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