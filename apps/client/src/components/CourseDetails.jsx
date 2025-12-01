import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';

const CourseDetails = () => {
    const { id } = useParams();
    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
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
        <div className="h-screen flex justify-center items-center">
            <div className="loading-spinner"></div>
        </div>
    );

    if (!course) return <div className="text-center text-content-secondary py-8">Course not found.</div>;

    return (
        <>
            <nav className="bg-indigo-600 text-white px-8 py-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold m-0 text-white">
                        AIN SHAMS
                        <span className="block text-xs font-normal tracking-wider text-brand-100 mt-1">UNIVERSITY | FACULTY OF ENGINEERING</span>
                    </h1>
                    <div className="flex gap-6">
                        {/* UPDATED: Link back to My Courses (Home) based on user role */}
                        <Link to={isAdminOrStaff ? '/admin/home' : '/home'} className="text-white hover:text-accent-300 transition-colors no-underline">← Back to My Courses</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-center py-16 px-8">
                <span className="bg-white/20 px-3 py-1 rounded text-sm mb-3 inline-block text-white">
                    {course.code}
                </span>
                <h1 className="text-4xl font-bold m-0 mb-4 text-white">{course.title}</h1>
                <p className="text-xl max-w-3xl mx-auto text-brand-100">
                    {course.semester || 'Fall 2024'} | {course.type} Course
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* LEFT SIDEBAR */}
                <div className="lg:col-span-1 bg-surface rounded-lg shadow-card p-6 h-fit sticky top-8">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-content-tertiary text-sm">Status</span>
                        <span className="text-success-600 font-bold flex items-center gap-1">
                            <span>●</span> Enrolled
                        </span>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                        <span className="text-content-tertiary text-sm">Duration</span>
                        <span className="font-semibold text-content">{course.lessons?.length ? `${course.lessons.length} Weeks` : 'TBA'}</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-content-tertiary text-sm">Subject</span>
                        <span className="font-semibold text-content">{course.subjectArea}</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-content-tertiary text-sm">Credits</span>
                        <span className="font-semibold text-content">{course.credits} Credit Hours</span>
                    </div>

                    <div className="border-t border-border pt-6 mt-6">
                        <button
                            className="w-full bg-error-600 hover:bg-error-700 text-content-inverse px-6 py-3 rounded-lg font-semibold transition-all text-sm"
                            onClick={() => alert('Drop deadline has passed.')}
                        >
                            Drop Course
                        </button>
                    </div>
                </div>

                {/* RIGHT MAIN CONTENT */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-surface rounded-lg shadow-card p-6">
                        <h2 className="text-xl font-bold text-content mb-4">Course Overview</h2>
                        <p className="text-content-secondary">{course.description}</p>
                    </div>

                    <div className="bg-surface rounded-lg shadow-card p-6">
                        <h2 className="text-xl font-bold text-content mb-4">Instructor</h2>
                        <div className="flex items-center mt-4 mb-8">
                            <div className="w-15 h-15 bg-brand-500 text-content-inverse rounded-full mr-4 flex items-center justify-center text-2xl font-bold">
                                {course.professor ? course.professor.charAt(0) : "T"}
                            </div>
                            <div>
                                <strong className="text-content">{course.professor || "To Be Announced"}</strong><br />
                                <span className="text-content-tertiary text-sm">Faculty of Engineering</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-card p-6">
                        <h2 className="text-xl font-bold text-content mb-4">Learning Materials</h2>
                        {course.lessons && course.lessons.length > 0 ? (
                            <ul className="list-none p-0 space-y-4">
                                {course.lessons.map((lesson, index) => (
                                    <li key={index} className="p-4 border border-border border-l-4 border-l-brand-500 rounded bg-surface flex justify-between items-center">
                                        <div>
                                            <strong className="text-brand-500 block mb-1">Week {index + 1}</strong>
                                            <span className="text-content">{lesson.title}</span>
                                        </div>
                                        <span className="text-xs text-content-tertiary bg-surface-tertiary px-2 py-1 rounded">
                                            {lesson.duration || '1h 30m'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 bg-surface-tertiary rounded-lg text-center text-content-tertiary">
                                No lessons have been uploaded for this course yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseDetails;