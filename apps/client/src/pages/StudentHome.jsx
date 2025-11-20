import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/StudentHome.css';

function StudentHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="student-home-container">
            <div className="student-home-card">
                <h1>Welcome to Orchestrate UMS</h1>
                <div className="user-info">
                    <p><strong>Name:</strong> {user?.name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Role:</strong> {user?.role}</p>
                    {user?.role === 'student' && user?.maxCredits && (
                        <p><strong>Max Credits:</strong> {user.maxCredits}</p>
                    )}
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
        </div>
    );
}

export default StudentHome;

