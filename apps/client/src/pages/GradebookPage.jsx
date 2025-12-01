// Updated File: src/components/GradebookPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Using axios directly, based on CourseDetails.jsx

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api';

function GradebookPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState(null); // Store entire assessment object
    const [gradeData, setGradeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // --- 1. Fetch ALL Courses Taught by this user
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Uses the NEW backend route
                const response = await axios.get(`${API_BASE_URL}/assessments/courses/my-teaching-courses`);
                setCourses(response.data.courses || []);
            } catch (error) {
                setMessage('Error loading courses. Ensure you are logged in as admin/staff and the new backend route is defined.');
            }
        };
        fetchCourses();
    }, []);

    // --- 2. Fetch Assessments when a Course is selected
    useEffect(() => {
        setAssessments([]);
        setSelectedAssessment(null);
        setGradeData([]);

        if (selectedCourseId) {
            const fetchAssessments = async () => {
                try {
                    // Uses the NEW backend route
                    const response = await axios.get(`${API_BASE_URL}/assessments/course/${selectedCourseId}/assessments`);
                    setAssessments(response.data.assessments || []);
                } catch (error) {
                    setMessage('Error loading assessments.');
                }
            };
            fetchAssessments();
        }
    }, [selectedCourseId]);

    // --- 3. Fetch Student Grades when an Assessment is selected
    useEffect(() => {
        if (!selectedAssessment) {
            setGradeData([]);
            return;
        }

        setLoading(true);
        setMessage('');

        // Uses your EXISTING backend route: GET /api/assessments/:assessmentId/grades
        const fetchGrades = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/assessments/${selectedAssessment._id}/grades`);
                setGradeData(response.data.grades);
                setLoading(false);
            } catch (error) {
                setMessage('Error loading student grades or assessment data.');
                setLoading(false);
            }
        };
        fetchGrades();

    }, [selectedAssessment]);

    const handleAssessmentChange = (e) => {
        const id = e.target.value;
        const assessment = assessments.find(a => a._id === id) || null;
        setSelectedAssessment(assessment);
    };

    // --- 4. Grade Submission Handler (Uses your EXISTING backend route)
    const handleGradeSubmission = async (studentId, score, feedback) => {
        try {
            const data = {
                assessmentId: selectedAssessment._id,
                studentId: studentId,
                score: score !== null && score !== '' ? Number(score) : null,
                feedback: feedback
            };

            // Uses your EXISTING backend route: POST /api/assessments/grade
            const response = await axios.post(`${API_BASE_URL}/assessments/grade`, data);

            // Update the local state with the new grade/feedback
            setGradeData(prevData =>
                prevData.map(item =>
                    item.student._id === studentId
                        ? { ...item, score: response.data.grade.score, feedback: response.data.grade.feedback }
                        : item
                )
            );
            // After successful save
            const savedStudent = gradeData.find(g => g.student._id === studentId);
            setMessage(`Grade saved successfully for ${savedStudent?.student?.name || 'Student'}!`);
        } catch (error) {
            setMessage(`Failed to save grade: ${error.response?.data?.message || error.message}`);
        }
    };


    // --- Render Logic ---
    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/home')}
                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 mb-4 shadow-button hover:shadow-button-hover"
                    >
                        Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-content m-0">Assessment Gradebook</h1>
                </div>

                <div className="bg-surface rounded-lg shadow-card p-6 mb-6">
                    {/* Course Selector */}
                    <div className="mb-6">
                        <label htmlFor="course-select" className="block text-sm font-medium mb-2 text-content">Select Course:</label>
                        <select
                            id="course-select"
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        >
                            <option value="">-- Choose a Course --</option>
                            {courses.map(course => (
                                <option key={course._id} value={course._id}>
                                    {course.code} - {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assessment Selector */}
                    <div className="mb-6">
                        <label htmlFor="assessment-select" className="block text-sm font-medium mb-2 text-content">Select Assessment:</label>
                        <select
                            id="assessment-select"
                            value={selectedAssessment?._id || ''}
                            onChange={handleAssessmentChange}
                            disabled={assessments.length === 0}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed"
                        >
                            <option value="">-- Choose an Assessment --</option>
                            {assessments.map(assessment => (
                                <option key={assessment._id} value={assessment._id}>
                                    {assessment.title} (Max: {assessment.totalMarks})
                                </option>
                            ))}
                        </select>
                    </div>

                    {message && <div className="bg-info-100 text-info-700 px-4 py-3 rounded-lg text-sm border border-info-200">{message}</div>}
                </div>

                {/* Grade Table Display */}
                {selectedAssessment && !loading && (
                    <GradeTable
                        gradeData={gradeData}
                        onSaveGrade={handleGradeSubmission}
                        totalMarks={selectedAssessment.totalMarks} // Pass max marks to table
                    />
                )}

                {loading && <p className="text-center text-content-secondary">Loading student data...</p>}
            </div>
        </div>
    );
}

// Sub-Component to display and handle grading for each student
function GradeTable({ gradeData, onSaveGrade, totalMarks }) {
    const [currentGrades, setCurrentGrades] = useState({});

    useEffect(() => {
        const initialGrades = {};
        gradeData.forEach(item => {
            initialGrades[item.student._id] = {
                score: item.score !== null ? item.score : '',
                feedback: item.feedback || '',
            };
        });
        setCurrentGrades(initialGrades);
    }, [gradeData]);

    // ... (handleChange and handleSave logic remain the same as previous)

    const handleChange = (studentId, field, value) => {
        setCurrentGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
            },
        }));
    };

    const handleSave = (studentId) => {
        const studentGrade = currentGrades[studentId];
        onSaveGrade(studentId, studentGrade.score, studentGrade.feedback);
    };


    if (gradeData.length === 0) {
        return <p className="text-center text-content-secondary py-8">No students enrolled for this assessment, or data is still loading.</p>;
    }

    return (
        <div className="bg-surface rounded-lg shadow-card p-6">
            <h2 className="text-xl font-bold text-content mb-6">Students to Grade ({gradeData.length})</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-tertiary border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Student Name</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Current Score</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Max Marks</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Grade Input</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Feedback Input</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-content">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gradeData.map(item => (
                            <tr key={item.student._id} className="border-b border-border hover:bg-surface-hover transition-colors">
                                <td className="px-4 py-3 text-sm text-content">{item.student.name}</td>
                                <td className="px-4 py-3 text-sm text-content font-semibold">{item.score !== null ? item.score : 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-content-secondary">{totalMarks}</td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max={totalMarks}
                                        value={currentGrades[item.student._id]?.score ?? ''}
                                        onChange={(e) => handleChange(item.student._id, 'score', e.target.value)}
                                        placeholder={`Score (Max: ${totalMarks})`}
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={currentGrades[item.student._id]?.feedback ?? ''}
                                        onChange={(e) => handleChange(item.student._id, 'feedback', e.target.value)}
                                        placeholder="Add Feedback"
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleSave(item.student._id)}
                                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2 rounded-md text-sm font-medium transition-all shadow-button hover:shadow-button-hover"
                                    >
                                        Save
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GradebookPage;