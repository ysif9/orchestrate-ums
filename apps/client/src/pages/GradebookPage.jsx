// Updated File: src/components/GradebookPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Using axios directly, based on CourseDetails.jsx
import '../styles/GradebookPage.css';

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
        <div className="gradebook-container">
            <div className="gradebook-header">
                <button
                    onClick={() => navigate('/admin/home')}
                    className="back-home-btn"
                >
                    Back to Home
                </button>
                <h1>Assessment Gradebook</h1>
            </div>

            {/* Course Selector */}
            <div className="selector-group">
                <label htmlFor="course-select">Select Course:</label>
                <select
                    id="course-select"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
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
            <div className="selector-group">
                <label htmlFor="assessment-select">Select Assessment:</label>
                <select
                    id="assessment-select"
                    value={selectedAssessment?._id || ''}
                    onChange={handleAssessmentChange}
                    disabled={assessments.length === 0}
                >
                    <option value="">-- Choose an Assessment --</option>
                    {assessments.map(assessment => (
                        <option key={assessment._id} value={assessment._id}>
                            {assessment.title} (Max: {assessment.totalMarks})
                        </option>
                    ))}
                </select>
            </div>

            {message && <div className="status-message">{message}</div>}

            {/* Grade Table Display */}
            {selectedAssessment && !loading && (
                <GradeTable 
                    gradeData={gradeData} 
                    onSaveGrade={handleGradeSubmission} 
                    totalMarks={selectedAssessment.totalMarks} // Pass max marks to table
                />
            )}
            
            {loading && <p>Loading student data...</p>}
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
        return <p>No students enrolled for this assessment, or data is still loading.</p>;
    }

    return (
        <div className="grade-table-wrapper">
            <h2>Students to Grade ({gradeData.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Current Score</th>
                        <th>Max Marks</th>
                        <th>Grade Input</th>
                        <th>Feedback Input</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {gradeData.map(item => (
                        <tr key={item.student._id}>
                            <td>{item.student.name}</td>
                            <td>{item.score !== null ? item.score : 'N/A'}</td>
                            <td>{totalMarks}</td> 
                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    max={totalMarks}
                                    value={currentGrades[item.student._id]?.score ?? ''}
                                    onChange={(e) => handleChange(item.student._id, 'score', e.target.value)}
                                    placeholder={`Score (Max: ${totalMarks})`}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={currentGrades[item.student._id]?.feedback ?? ''}
                                    onChange={(e) => handleChange(item.student._id, 'feedback', e.target.value)}
                                    placeholder="Add Feedback"
                                />
                            </td>
                            <td>
                                <button onClick={() => handleSave(item.student._id)} className="save-btn">
                                    Save
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default GradebookPage;