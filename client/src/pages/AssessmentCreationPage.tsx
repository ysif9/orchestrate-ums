import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, PlusCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

function AssessmentCreationPage() {
    const navigate = useNavigate();
    const user: any = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    const [courses, setCourses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        course: '',
        title: '',
        description: '',
        type: 'assignment',
        totalMarks: 100,
        dueDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const response = await axios.get(`${API_BASE_URL}/assessments/courses/my-teaching-courses`, config);
                setCourses(response.data.courses || []);
            } catch (err) {
                setError('Failed to load your courses. Please ensure you have created courses.');
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'totalMarks' ? parseInt(value) || null : value
        }));
        setError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        handleChange(name, value);
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!formData.course || !formData.title || !formData.totalMarks) {
            setError('Course, Title, and Total Marks are required.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await axios.post(`${API_BASE_URL}/assessments`, formData, config);
            setMessage('Assessment created successfully! Redirecting...');
            setTimeout(() => navigate('/admin/courses'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create assessment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Create New Assessment</h1>
                        <p className="text-muted-foreground">Add quizzes, assignments, midterms, or final exams</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-primary" />
                            Assessment Details
                        </CardTitle>
                        <CardDescription>Fill out the form below to create a new assessment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-6 bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2 border border-green-200">
                                <PlusCircle className="w-4 h-4" />
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="course">Select Course <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={formData.course}
                                        onValueChange={(val) => handleChange('course', val)}
                                        disabled={courses.length === 0}
                                    >
                                        <SelectTrigger id="course">
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
                                    {courses.length === 0 && <p className="text-[10px] text-muted-foreground">No courses found.</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => handleChange('type', val)}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="assignment">Assignment</SelectItem>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                            <SelectItem value="midterm">Midterm Exam</SelectItem>
                                            <SelectItem value="final">Final Exam</SelectItem>
                                            <SelectItem value="project">Project</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Assessment Title <span className="text-destructive">*</span></Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Final Exam, Midterm Quiz"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="totalMarks">Total Marks <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="totalMarks"
                                        name="totalMarks"
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={formData.totalMarks}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        name="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide details, rubric, or submission instructions..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {loading ? 'Creating Assessment...' : 'Create Assessment'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AssessmentCreationPage;
