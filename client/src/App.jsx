import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import StudentHome from './pages/StudentHome.jsx';
import AdminHome from './pages/AdminHome.jsx';
import AdminCourseManager from './pages/AdminCourseManager.jsx';
import CourseCatalog from './pages/CourseCatalog.jsx';
import CatalogCourseDetails from './pages/CatalogCourseDetails.jsx';
import CourseDetails from './components/CourseDetails.jsx';
import {authService} from './services/authService.js';
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
import AllocateResources from './pages/AllocateResources';
import ProfessorResources from './pages/ProfessorResources';
import StudentResources from './pages/StudentResources';
import AdmissionsInfoPage from './pages/AdmissionsInfoPage.jsx';
import ApplicationFormPage from './pages/ApplicationFormPage.jsx';
import ApplicationConfirmationPage from './pages/ApplicationConfirmationPage.jsx';

/**
 * Protected Route Component
 */
function ProtectedRoute({children}) {
    const isAuthenticated = authService.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace/>;
}

/**
 * Staff Only Route Component
 */
function StaffOnlyRoute({children}) {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    const user = authService.getCurrentUser();
    if (user?.role !== 'staff') {
        return <Navigate to="/admin/home" replace/>;
    }

    return children;
}

/**
 * Root Redirect Component
 */
function RootRedirect() {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    return <Navigate to={isAdminOrStaff ? "/admin/home" : "/home"} replace/>;
}

function MyResourcesPage() {
    const user = authService.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    if (user.role === 'professor') {
        return <ProfessorResources/>;
    } else if (user.role === 'student') {
        return <StudentResources/>;
    } else {
        // Staff/admin view
        return <Navigate to="/facilities/allocate" replace/>;
    }
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/admissions" element={<AdmissionsInfoPage/>}/>
                <Route path="/apply" element={<ApplicationFormPage/>}/>
                <Route path="/apply/confirmation/:id" element={<ApplicationConfirmationPage/>}/>

                {/* Protected */}
                <Route path="/home" element={<ProtectedRoute><StudentHome/></ProtectedRoute>}/>
                <Route path="/courses" element={<ProtectedRoute><CourseCatalog/></ProtectedRoute>}/>
                <Route path="/catalog" element={<ProtectedRoute><CourseCatalog/></ProtectedRoute>}/>
                <Route path="/catalog/course/:id" element={<ProtectedRoute><CatalogCourseDetails/></ProtectedRoute>}/>

                {/* Admin/Staff */}
                <Route path="/admin/home" element={<ProtectedRoute><AdminHome/></ProtectedRoute>}/>
                <Route path="/admin/courses" element={<ProtectedRoute><AdminCourseManager/></ProtectedRoute>}/>
                <Route path="/admin/assessments/create"
                       element={<ProtectedRoute><AssessmentCreationPage/></ProtectedRoute>}/>
                <Route path="/admin/applications" element={<ProtectedRoute><ApplicationListPage/></ProtectedRoute>}/>
                <Route path="/admin/applications/:id/review"
                       element={<ProtectedRoute><ApplicationReviewPage/></ProtectedRoute>}/>
                <Route path="/admin/gradebook" element={<ProtectedRoute><GradebookPage/></ProtectedRoute>}/>
                <Route path="/admin/transcript-requests"
                       element={<ProtectedRoute><StaffTranscriptManagementPage/></ProtectedRoute>}/>
                <Route path="/admin/student-records"
                       element={<ProtectedRoute><StudentRecordSearchPage/></ProtectedRoute>}/>
                <Route path="/admin/student-records/:id/summary"
                       element={<ProtectedRoute><StudentRecordSummaryPage/></ProtectedRoute>}/>
                <Route path="/admin/room-booking" element={<ProtectedRoute><RoomBookingPage/></ProtectedRoute>}/>
                <Route path="/admin/rooms" element={<StaffOnlyRoute><AdminRoomManager/></StaffOnlyRoute>}/>
                <Route path="/admin/rooms/:labId/stations"
                       element={<StaffOnlyRoute><AdminLabStationManager/></StaffOnlyRoute>}/>

                {/* Lab */}
                <Route path="/lab-stations" element={<ProtectedRoute><LabStationBookingPage/></ProtectedRoute>}/>

                {/* Transcripts */}
                <Route path="/transcript-requests"
                       element={<ProtectedRoute><TranscriptRequestsPage/></ProtectedRoute>}/>
                <Route path="/transcript-requests/:id"
                       element={<ProtectedRoute><ViewTranscriptPage/></ProtectedRoute>}/>

                {/* Resources */}
                <Route path="/facilities/allocate" element={<StaffOnlyRoute><AllocateResources/></StaffOnlyRoute>}/>
                <Route path="/facilities/my-resources" element={<ProtectedRoute><MyResourcesPage/></ProtectedRoute>}/>

                {/* Other */}
                <Route path="/my-grades" element={<ProtectedRoute><MyGradesPage/></ProtectedRoute>}/>
                <Route path="/course/:id" element={<ProtectedRoute><CourseDetails/></ProtectedRoute>}/>

                {/* Root redirect */}
                <Route path="/" element={<RootRedirect/>}/>
                <Route path="*" element={<RootRedirect/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;