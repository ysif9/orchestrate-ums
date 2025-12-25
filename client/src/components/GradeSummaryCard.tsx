import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";

export interface CourseAssignment {
  id: number;
  name: string;
  score: number;
  maxScore: number;
  weight?: number | null;
}

export interface CourseSummary {
  id: number;
  code: string;
  name: string;
  term?: string;
  runningAverage: number;
  assignments: CourseAssignment[];
}

export interface AcademicSummary {
    gpa?: number;          // overall GPA across all current/graded courses
    completedCredits?: number;
    courses: CourseSummary[];
}

interface GradeSummaryCardProps {
  summary?: AcademicSummary;
  loading?: boolean;
  error?: string;
}

export interface StudentRecordSummaryResponse {
  success: boolean;
  message?: string;
  student: any;
  academicSummary: {
    gpa: number | null;
    totalCredits: number;
    completedCourses: number;
  };
  currentTermRegistration?: {
    semester: any;
    registeredCredits: number;
    registrationStatus: string;
    enrolledCourses: any[];
  };
  courseHistory: any[];
  activeHolds: string[];
}


export function GradeSummaryCard({ summary, loading, error }: GradeSummaryCardProps) {
  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-base">Academic Progress</span>
        </CardTitle>
        <CardDescription>
          Real-time summary of current courses and grades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading academic summary...
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">
            {error}
          </div>
        ) : !summary || !summary.courses || summary.courses.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No current course grades available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {summary.courses.map((course) => (
              <details
                key={course.id}
                className="rounded-md border bg-white p-3"
              >
                <summary className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">
                      {course.code} – {course.name}
                    </div>
                    {course.term && (
                      <div className="text-xs text-muted-foreground">
                        Term: {course.term}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {course.runningAverage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Running average
                    </div>
                  </div>
                </summary>

                <div className="mt-3 border-t pt-3">
                  {!course.assignments || course.assignments.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No individual assignment grades recorded yet.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="text-muted-foreground border-b">
                        <tr>
                          <th className="py-1 text-left font-medium">
                            Assignment
                          </th>
                          <th className="py-1 text-right font-medium">
                            Score
                          </th>
                          <th className="py-1 text-right font-medium">
                            Weight
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {course.assignments.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-1">{a.name}</td>
                            <td className="py-1 text-right">
                              {a.score} / {a.maxScore}
                            </td>
                            <td className="py-1 text-right">
                              {a.weight != null
                                ? `${(a.weight * 100).toFixed(0)}%`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
