import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseDetails = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
                setCourse(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    if (loading) return (
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div className="loading-spinner" style={{borderTopColor: '#003366'}}></div>
        </div>
    );
    
    if (!course) return <div>Course not found.</div>;

    return (
        <>
             <nav className="navbar">
                <h1>
                    AIN SHAMS
                    <span className="uni-subtext">UNIVERSITY | FACULTY OF ENGINEERING</span>
                </h1>
                <div className="nav-links">
                    {/* UPDATED: Link back to My Courses (Home) instead of Dashboard */}
                    <Link to="/home">← Back to My Courses</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="details-hero">
                <span style={{
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    fontSize: '0.9rem', 
                    marginBottom: '10px', 
                    display: 'inline-block'
                }}>
                    {course.code}
                </span>
                <h1>{course.title}</h1>
                <p style={{fontSize: '1.2rem', maxWidth: '800px', margin: '1rem auto', opacity: 0.9}}>
                    {course.semester || 'Fall 2024'} | {course.type} Course
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="details-content-wrapper">
                
                {/* LEFT SIDEBAR */}
                <div className="sidebar">
                    <div className="sidebar-item">
                        <span className="sidebar-label">Status</span>
                        <span style={{color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span>●</span> Enrolled
                        </span>
                    </div>
                    
                    <div className="sidebar-item">
                        <span className="sidebar-label">Duration</span>
                        <span>{course.lessons?.length ? `${course.lessons.length} Weeks` : 'TBA'}</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Subject</span>
                        <span>{course.subjectArea}</span>
                    </div>
                    <div className="sidebar-item">
                        <span className="sidebar-label">Credits</span>
                        <span>{course.credits} Credit Hours</span>
                    </div>

                    <div style={{borderTop: '1px solid #eee', paddingTop: '1.5rem', marginTop: '1.5rem'}}>
                        <button 
                            className="enroll-btn" 
                            style={{backgroundColor: '#dc2626', fontSize: '0.9rem'}}
                            onClick={() => alert('Drop deadline has passed.')}
                        >
                            Drop Course
                        </button>
                    </div>
                </div>

                {/* RIGHT MAIN CONTENT */}
                <div className="main-content">
                    <h2>Course Overview</h2>
                    <p>{course.description}</p>

                    <h2>Instructor</h2>
                    <div style={{display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '2rem'}}>
                        <div style={{
                            width: '60px', height: '60px', 
                            background: '#003366', color: 'white',
                            borderRadius: '50%', marginRight: '15px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 'bold'
                        }}>
                            {course.professor ? course.professor.charAt(0) : "T"}
                        </div>
                        <div>
                            <strong>{course.professor || "To Be Announced"}</strong><br/>
                            <span style={{color: '#666', fontSize: '0.9rem'}}>Faculty of Engineering</span>
                        </div>
                    </div>

                    <h2>Learning Materials</h2>
                    {course.lessons && course.lessons.length > 0 ? (
                        <ul className="lesson-list" style={{listStyle: 'none', padding: 0}}>
                            {course.lessons.map((lesson, index) => (
                                <li key={index} style={{
                                    padding: '15px', 
                                    border: '1px solid #eee', 
                                    borderLeft: '4px solid #003366',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{color: '#003366', display: 'block', marginBottom: '4px'}}>Week {index + 1}</strong>
                                        {lesson.title}
                                    </div>
                                    <span style={{fontSize: '0.85rem', color: '#666', background: '#f0f2f5', padding: '4px 8px', borderRadius: '4px'}}>
                                        {lesson.duration || '1h 30m'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{padding: '2rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center', color: '#666'}}>
                            No lessons have been uploaded for this course yet.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CourseDetails;