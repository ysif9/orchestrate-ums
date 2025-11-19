import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// PASTE THE STUDENT ID YOU COPIED FROM THE SEED SCRIPT HERE
const STUDENT_ID = "691e29b07a52715fe1c3182f"; 

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [completedCourseIds, setCompletedCourseIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get All Courses
                const coursesRes = await axios.get('http://localhost:5000/api/courses');
                setCourses(coursesRes.data);

                // 2. Get Student's Enrollments (Simulating logged in user)
                const enrollRes = await axios.get('http://localhost:5000/api/enrollments');
                
                // Filter only "completed" courses for this specific student
                const completed = enrollRes.data
                    .filter(enr => enr.student === STUDENT_ID && enr.status === 'completed')
                    .map(enr => enr.course); // Get the course IDs

                setCompletedCourseIds(completed);

            } catch (error) {
                console.error("Error loading dashboard:", error);
            }
        };

        fetchData();
    }, []);

    const isLocked = (course) => {
        if (!course.prerequisites || course.prerequisites.length === 0) return false;
        
        // Check if ALL prerequisites are in the completed list
        const hasMetPrereqs = course.prerequisites.every(prereqId => 
            completedCourseIds.includes(prereqId)
        );
        
        return !hasMetPrereqs;
    };

    return (
        <div className="dashboard">
            <h1>Course Dashboard</h1>
            <div className="course-grid">
                {courses.map(course => {
                    const locked = isLocked(course);
                    
                    return (
                        <div key={course._id} className={`course-wrapper ${locked ? 'locked-wrapper' : ''}`}>
                             {/* If locked, we disable the link or show a message */}
                            {locked ? (
                                <div className="course-card locked">
                                    <div className="lock-icon">🔒</div>
                                    <h3>{course.code}: {course.title}</h3>
                                    <p>Prerequisites not met</p>
                                </div>
                            ) : (
                                <Link to={`/course/${course._id}`} className="course-card-link">
                                    <div className="course-card">
                                        <h3>{course.code}: {course.title}</h3>
                                        <p>{course.type} | {course.credits} Credits</p>
                                        <span className="details-btn">View Details &rarr;</span>
                                    </div>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;