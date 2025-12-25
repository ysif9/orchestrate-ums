import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeSummaryCard, type AcademicSummary } from "@/components/GradeSummaryCard";

import {
  Users,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
  GraduationCap,
  BarChart3
} from 'lucide-react';

interface LinkedStudent {
  linkId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentStatus: number | string; // Can be integer enum (1-5) or string
  linkedAt: string;

  academicSummary?: AcademicSummary;
  academicSummaryLoading?: boolean;
  academicSummaryError?: string;
}

function ParentHome() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinkedStudents();
  }, []);

  // when linkedStudents change, fetch academic summaries for each linked student
  useEffect(() => {
    if (linkedStudents.length === 0) return;

    linkedStudents.forEach((s) => {
      if (!s.academicSummary && !s.academicSummaryLoading && !s.academicSummaryError) {
        fetchAcademicSummary(s.studentId);
      }
    });
  }, [linkedStudents]);

  const fetchLinkedStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/parents/linked-students');
      setLinkedStudents(response.data.students);
    } catch (err: any) {
      console.error("Error fetching linked students:", err);
      setError(err.response?.data?.message || 'Failed to load linked students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicSummary = async (studentId: number) => {
    setLinkedStudents(prev =>
      prev.map(s =>
        s.studentId === studentId
          ? { ...s, academicSummaryLoading: true, academicSummaryError: undefined }
          : s
      )
    );

    try {
      const res = await axios.get(
        `http://localhost:5000/api/parents/linked-students/${studentId}/academic-summary`
      );
      setLinkedStudents(prev =>
        prev.map(s =>
          s.studentId === studentId
            ? {
                ...s,
                academicSummary: res.data.summary,
                academicSummaryLoading: false
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Error fetching academic summary:', err);
      setLinkedStudents(prev =>
        prev.map(s =>
          s.studentId === studentId
            ? {
                ...s,
                academicSummaryLoading: false,
                academicSummaryError:
                  err.response?.data?.message || 'Failed to load academic summary.'
              }
            : s
        )
      );
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Convert status enum (integer) to readable string
  const getStatusText = (status: number | string | undefined | null): string => {
    if (status === null || status === undefined) {
      return 'Unknown';
    }

    if (typeof status === 'string') {
      return status;
    }

    // StudentStatus enum: Active=1, Inactive=2, OnHold=3, Suspended=4, Graduated=5
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'On Hold';
      case 4: return 'Suspended';
      case 5: return 'Graduated';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number | string | undefined | null): string => {
    if (status === null || status === undefined) {
      return 'bg-gray-500';
    }

    const statusStr =
      typeof status === 'string'
        ? status.toLowerCase()
        : getStatusText(status).toLowerCase();

    switch (statusStr) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'on hold': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      case 'graduated': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Aggregate academic summaries for all linked students (only those linked to this parent)
  const buildGlobalAcademicSummary = () => {
    const summaries = linkedStudents
      .map(s => s.academicSummary)
      .filter((s): s is AcademicSummary => !!s);

    if (summaries.length === 0) {
      return null;
    }

    let totalGpa = 0;
    let gpaCount = 0;
    let totalCourses = 0;
    let totalCompletedCredits = 0;

    summaries.forEach(s => {
      if (typeof s.gpa === 'number') {
        totalGpa += s.gpa;
        gpaCount += 1;
      }
      if (Array.isArray(s.courses)) {
        totalCourses += s.courses.length;
      }
      if (typeof (s as any).completedCredits === 'number') {
        totalCompletedCredits += (s as any).completedCredits;
      }
    });

    const avgGpa = gpaCount > 0 ? totalGpa / gpaCount : null;

    return {
      avgGpa,
      totalCourses,
      totalCompletedCredits
    };
  };

  const globalAcademic = buildGlobalAcademicSummary();

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-foreground">
            AIN SHAMS
            <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
              UNIVERSITY | PARENT PORTAL
            </span>
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-primary-foreground/90 text-sm">
              Welcome, {(user as any)?.name}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* DASHBOARD HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Parent Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your children's academic progress and information
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* LINKED STUDENTS SECTION */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Linked Students
            </CardTitle>
            <CardDescription>
              Students connected to your parent account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : linkedStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">No Students Linked</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't linked any student accounts yet. Click "Link Student Account" to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {linkedStudents.map((student) => (
                  <Card key={student.linkId} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{student.studentName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {student.studentEmail}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(student.studentStatus)}>
                          {getStatusText(student.studentStatus)}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mb-4">
                        Linked on {new Date(student.linkedAt).toLocaleDateString()}
                      </div>

                      {/* Per-student academic summary */}
                      <GradeSummaryCard
                        summary={student.academicSummary}
                        loading={student.academicSummaryLoading}
                        error={student.academicSummaryError}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SUMMARY SECTIONS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendance card with static absences number */}
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                Attendance Records
              </CardTitle>
              <CardDescription>
                View your children's attendance history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Link a student account to see attendance information.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-4 text-sm">
                  <p className="text-muted-foreground">
                    Quick overview of attendance for students linked to your account.
                  </p>
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-3xl font-semibold text-primary">3</span>
                    <span className="text-sm text-muted-foreground">
                      recorded absences this term (sample data)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Detailed attendance history will be available in a future update.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Academic Summary tile for linked students */}
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
                Academic Summary
              </CardTitle>
              <CardDescription>
                Overview of grades and performance for your linked students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Link a student account to see academic performance.
                  </p>
                </div>
              ) : linkedStudents.some(s => s.academicSummaryLoading) && !globalAcademic ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : globalAcademic ? (
                <div className="space-y-3 py-2 text-sm">
                  <p className="text-muted-foreground">
                    Combined snapshot for all students linked to your account.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Average GPA</p>
                      <p className="text-xl font-semibold text-primary">
                        {globalAcademic.avgGpa !== null
                          ? globalAcademic.avgGpa.toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active courses</p>
                      <p className="text-xl font-semibold text-primary">
                        {globalAcademic.totalCourses}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed credits</p>
                      <p className="text-xl font-semibold text-primary">
                        {globalAcademic.totalCompletedCredits}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Detailed course-by-course information is available in the cards above.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Academic summaries are not available yet for your linked students.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ParentHome;
