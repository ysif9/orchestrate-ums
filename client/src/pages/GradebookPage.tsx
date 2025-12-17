import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api';

function GradebookPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
    const [gradeData, setGradeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // --- 1. Fetch ALL Courses Taught by this user
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Uses the NEW backend route
                // Ensure auth header is manually added or verify if axios interceptor handles it.
                // The original code didn't seem to include headers explicitly for this call? 
                // Wait, original Step 494 line 25: axios.get(...) - no headers?
                // Actually most other files use a service which includes headers.
                // If this page worked, maybe cookie based? Or maybe it was broken?
                // I should probably add auth headers if possible, but let's stick to original logic first.
                // Re-reading original file: Yes, line 25 has no headers.
                // However generally we need auth. Let's assume axios is configured globally or add headers manually using authService if imported.
                // I will add authService here just in case to be safe, as other pages do.
                const token = localStorage.getItem('token'); // Simplistic approach or use authService
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const response = await axios.get(`${API_BASE_URL}/assessments/courses/my-teaching-courses`, config);
                setCourses(response.data.courses || []);
            } catch (error) {
                setMessage('Error loading courses. Ensure you are logged in as admin/staff.');
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
                    const token = localStorage.getItem('token');
                    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                    const response = await axios.get(`${API_BASE_URL}/assessments/course/${selectedCourseId}/assessments`, config);
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

        const fetchGrades = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const response = await axios.get(`${API_BASE_URL}/assessments/${selectedAssessment.id}/grades`, config);
                setGradeData(response.data.grades);
                setLoading(false);
            } catch (error) {
                setMessage('Error loading student grades or assessment data.');
                setLoading(false);
            }
        };
        fetchGrades();

    }, [selectedAssessment]);

    const handleAssessmentChange = (value: string) => {
        const id = value;
        const assessment = assessments.find(a => a.id.toString() === id || a.id === parseInt(id)) || null;
        setSelectedAssessment(assessment);
    };

    // --- 4. Grade Submission Handler
    const handleGradeSubmission = async (studentId: number, score: any, feedback: string) => {
        try {
            const data = {
                assessmentId: selectedAssessment.id,
                studentId: studentId,
                score: score !== null && score !== '' ? Number(score) : null,
                feedback: feedback
            };

            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.post(`${API_BASE_URL}/assessments/grade`, data, config);

            setGradeData(prevData =>
                prevData.map(item =>
                    item.student.id === studentId
                        ? { ...item, score: response.data.grade.score, feedback: response.data.grade.feedback }
                        : item
                )
            );

            const savedStudent = gradeData.find(g => g.student.id === studentId);
            setMessage(`Grade saved successfully for ${savedStudent?.student?.name || 'Student'}!`);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            setMessage(`Failed to save grade: ${error.response?.data?.message || error.message}`);
        }
    };


    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Assessment Gradebook</h1>
                        <p className="text-muted-foreground">Manage student grades and feedback</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/admin/home')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Assessment</CardTitle>
                        <CardDescription>Select a course and assessment to view grades</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 md:flex md:space-y-0 md:space-x-4">
                        {/* Course Selector */}
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="course-select">Select Course</Label>
                            <Select
                                value={selectedCourseId}
                                onValueChange={setSelectedCourseId}
                            >
                                <SelectTrigger id="course-select">
                                    <SelectValue placeholder="-- Choose a Course --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.code} - {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assessment Selector */}
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="assessment-select">Select Assessment</Label>
                            <Select
                                value={selectedAssessment?.id?.toString() || ''}
                                onValueChange={handleAssessmentChange}
                                disabled={assessments.length === 0}
                            >
                                <SelectTrigger id="assessment-select">
                                    <SelectValue placeholder="-- Choose an Assessment --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assessments.map(assessment => (
                                        <SelectItem key={assessment.id} value={assessment.id.toString()}>
                                            {assessment.title} (Max: {assessment.totalMarks})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {message && (
                    <div className="bg-primary/10 text-primary px-4 py-3 rounded-md text-sm flex items-center gap-2 border border-primary/20">
                        <AlertCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}

                {/* Grade Table Display */}
                {selectedAssessment && !loading && (
                    <GradeTable
                        gradeData={gradeData}
                        onSaveGrade={handleGradeSubmission}
                        totalMarks={selectedAssessment.totalMarks}
                    />
                )}

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-Component to display and handle grading for each student
function GradeTable({ gradeData, onSaveGrade, totalMarks }: { gradeData: any[], onSaveGrade: Function, totalMarks: number }) {
    const [currentGrades, setCurrentGrades] = useState<Record<string, { score: string | number, feedback: string }>>({});

    useEffect(() => {
        const initialGrades: any = {};
        gradeData.forEach(item => {
            initialGrades[item.student.id] = {
                score: item.score !== null ? item.score : '',
                feedback: item.feedback || '',
            };
        });
        setCurrentGrades(initialGrades);
    }, [gradeData]);

    const handleChange = (studentId: number, field: 'score' | 'feedback', value: string) => {
        setCurrentGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
            },
        }));
    };

    const handleSave = (studentId: number) => {
        // Find which studentID in currentGrades matches
        const studentGrade = currentGrades[studentId];
        if (studentGrade) {
            onSaveGrade(studentId, studentGrade.score, studentGrade.feedback);
        }
    };


    if (gradeData.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No students enrolled for this assessment, or data is still loading.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Students to Grade ({gradeData.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Current Score</TableHead>
                            <TableHead>Max Marks</TableHead>
                            <TableHead className="w-[150px]">Grade Input</TableHead>
                            <TableHead className="w-[200px]">Feedback Input</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gradeData.map(item => (
                            <TableRow key={item.student.id}>
                                <TableCell className="font-medium">{item.student.name}</TableCell>
                                <TableCell>{item.score !== null ? item.score : 'N/A'}</TableCell>
                                <TableCell>{totalMarks}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={totalMarks}
                                        value={currentGrades[item.student.id]?.score ?? ''}
                                        onChange={(e) => handleChange(item.student.id, 'score', e.target.value)}
                                        placeholder="Score"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={currentGrades[item.student.id]?.feedback ?? ''}
                                        onChange={(e) => handleChange(item.student.id, 'feedback', e.target.value)}
                                        placeholder="Feedback"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleSave(item.student.id)}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default GradebookPage;
