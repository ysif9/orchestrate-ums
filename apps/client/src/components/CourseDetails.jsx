import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseDetails = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err));
    }, [id]);

    if (!course) return <div>Loading...</div>;

    return (
        <>
             <nav className="navbar">
                <h1>
                    AIN SHAMS
                    <span className="uni-subtext">UNIVERSITY | FACULTY OF ENGINEERING</span>
                </h1>
                <div className="nav-links">
                    <Link to="/">Back to Dashboard</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="details-hero">
                <h1>{course.title}</h1>
                <p style={{fontSize: '1.2rem', maxWidth: '800px', margin: '1rem auto'}}>
                    {course.description}
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="details-content-wrapper">
                
                {/* LEFT SIDEBAR */}
                <div className="sidebar">
                    <button className="enroll-btn">Enroll Now</button>
                    <br /><br />
                    
                    <div className="sidebar-item">
                        <span className="sidebar-label">Duration</span>
                        <span>{course.lessons.length * 2} Weeks (Est.)</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Pace</span>
                        <span>{course.pace || "Self-paced"}</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Subject</span>
                        <span>{course.subjectArea}</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Difficulty</span>
                        <span>{course.difficulty}</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Credit</span>
                        <span>Audit for Free</span>
                    </div>
                </div>

                {/* RIGHT MAIN CONTENT */}
                <div className="main-content">
                    <h2>What you'll learn</h2>
                    <ul>
                        <li>Fundamental concepts of {course.subjectArea}</li>
                        <li>Understanding {course.title} in depth</li>
                        <li>Critical thinking and problem solving</li>
                    </ul>

                    <h2>Course Description</h2>
                    <p>{course.description}</p>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>

                    <h2>Instructors</h2>
                    <div style={{display: 'flex', alignItems: 'center', marginTop: '1rem'}}>
                        <div style={{
                            width: '60px', height: '60px', 
                            background: '#ddd', borderRadius: '50%', marginRight: '15px'
                        }}></div>
                        <div>
                            <strong>{course.professor}</strong><br/>
                            <span style={{color: '#666', fontSize: '0.9rem'}}>Harvard University</span>
                        </div>
                    </div>

                    <h2>Syllabus</h2>
                    <ul className="lesson-list" style={{listStyle: 'none', padding: 0}}>
                        {course.lessons.map((lesson, index) => (
                            <li key={index} style={{padding: '10px 0', borderBottom: '1px solid #eee'}}>
                                <strong>Week {index + 1}:</strong> {lesson.title} ({lesson.duration})
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default CourseDetails;