// src/pages/MyGradesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MyGradesPage.css';

const API_BASE = 'http://localhost:5000/api';

function MyGradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axios.get(`${API_BASE}/assessments/my-grades`);
        setGrades(res.data.grades || []);
      } catch (err) {
        setError('Failed to load your grades. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <div className="loading">Loading your grades...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-grades-page">
      <h1>My Grades & Feedback</h1>

      {grades.length === 0 ? (
        <p>No grades have been posted yet.</p>
      ) : (
        <table className="grades-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Assessment</th>
              <th>Type</th>
              <th>Score</th>
              <th>Out of</th>
              <th>Percentage</th>
              <th>Feedback</th>
              <th>Graded On</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade._id}>
                <td>{grade.assessment.course.code} - {grade.assessment.course.title}</td>
                <td>{grade.assessment.title}</td>
                <td>{grade.assessment.type}</td>
                <td>{grade.score !== null ? grade.score : '—'}</td>
                <td>{grade.assessment.totalMarks}</td>
                <td>
                  {grade.score !== null 
                    ? `${((grade.score / grade.assessment.totalMarks) * 100).toFixed(1)}%`
                    : '—'}
                </td>
                <td className="feedback">
                  {grade.feedback || <em>No feedback provided</em>}
                </td>
                <td>{new Date(grade.gradedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyGradesPage;