import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Loader2, AlertCircle, GraduationCap } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ASSESSMENT_TYPE_LABELS: Record<number, string> = {
    1: 'Assignment',
    2: 'Quiz',
    3: 'Midterm',
    4: 'Final',
    5: 'Project'
};

function MyGradesPage() {
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const res = await axios.get(`${API_BASE}/assessments/my-grades`, config);
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

    const calculateGPA = () => {
        if (grades.length === 0) return '0.00';
        // Simplified GPA calculation for demo
        const points = grades.reduce((acc, curr) => {
            if (!curr.score) return acc;
            const percentage = (curr.score / curr.assessment.totalMarks) * 100;
            let gp = 0;
            if (percentage >= 90) gp = 4.0;
            else if (percentage >= 85) gp = 3.7;
            else if (percentage >= 80) gp = 3.3;
            else if (percentage >= 75) gp = 3.0;
            else if (percentage >= 70) gp = 2.7;
            else if (percentage >= 65) gp = 2.3;
            else if (percentage >= 60) gp = 2.0;
            else if (percentage >= 50) gp = 1.0;
            return acc + gp;
        }, 0);
        return (points / grades.length).toFixed(2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh] text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading your grades...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh] text-destructive">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Grades & Feedback</h1>
                <p className="text-muted-foreground mt-1">View your assessment results and cumulative GPA</p>
            </div>

            {/* GPA Summary Card */}
            <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Cumulative GPA</h2>
                            <p className="text-sm text-muted-foreground">Calculated based on {grades.length} assessments</p>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                        {calculateGPA()}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Grade Report</CardTitle>
                    <CardDescription>Detailed breakdown of your performance</CardDescription>
                </CardHeader>
                <CardContent>
                    {grades.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No grades have been posted yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Assessment</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Out of</TableHead>
                                    <TableHead className="text-center">Percentage</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead className="text-right">Graded On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">
                                            {grade.assessment.course.code}
                                        </TableCell>
                                        <TableCell>{grade.assessment.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-[10px]">
                                                {ASSESSMENT_TYPE_LABELS[grade.assessment.type] || 'Other'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-primary">
                                            {grade.score !== null ? grade.score : '—'}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {grade.assessment.totalMarks}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {grade.score !== null
                                                ? `${((grade.score / grade.assessment.totalMarks) * 100).toFixed(1)}%`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm italic max-w-xs truncate">
                                            {grade.feedback || <span className="opacity-50">No feedback</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {new Date(grade.gradedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default MyGradesPage;
