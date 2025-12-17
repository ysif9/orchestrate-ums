import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Loader2, AlertCircle, GraduationCap } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function MyGradesPage() {
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading your grades...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">My Grades & Feedback</h1>
                            <p className="text-muted-foreground">View your assessment results</p>
                        </div>
                    </div>

                    <Button variant="outline" onClick={() => navigate('/home')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

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
                                                {grade.assessment.course.code} - {grade.assessment.course.title}
                                            </TableCell>
                                            <TableCell>{grade.assessment.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[10px]">
                                                    {grade.assessment.type}
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
        </div>
    );
}

export default MyGradesPage;
