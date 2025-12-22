import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function CourseCatalog() {
    // const navigate = useNavigate(); // Removed unused
    // Or just remove the line completely if not used.
    // The previous code had: const navigate = useNavigate();
    // I will remove it.

    const [courses, setCourses] = useState<any[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
    const [completedCourseIds, setCompletedCourseIds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const COURSE_TYPE_LABELS: Record<number, string> = {
        1: 'Core',
        2: 'Elective'
    };

    const DIFFICULTY_LABELS: Record<number, string> = {
        1: 'Introductory',
        2: 'Intermediate',
        3: 'Advanced'
    };

    const REVERSE_DIFFICULTY: Record<string, number> = {
        'Introductory': 1,
        'Intermediate': 2,
        'Advanced': 3
    };

    const REVERSE_COURSE_TYPE: Record<string, number> = {
        'Core': 1,
        'Elective': 2
    };

    // Filter states
    const [filters, setFilters] = useState({
        searchTerm: '',
        level: 'All',
        credits: 'All',
        type: 'All',
        hasPrerequisites: 'All'
    });

    // Fetch courses and enrollments
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all courses
                const coursesRes = await axios.get('http://localhost:5000/api/courses');
                setCourses(coursesRes.data);

                // Fetch user's enrollments to determine completed courses
                const enrollRes = await axios.get('http://localhost:5000/api/enrollments');
                const completed = enrollRes.data
                    .filter((enr: any) => enr.status === 'completed')
                    .map((enr: any) => enr.course.id);
                setCompletedCourseIds(completed);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Apply filters whenever courses or filter values change
    useEffect(() => {
        let result = courses;

        // Filter by level (difficulty)
        if (filters.level !== 'All') {
            const levelInt = REVERSE_DIFFICULTY[filters.level];
            result = result.filter(c => c.difficulty === levelInt);
        }

        // Filter by credits
        if (filters.credits !== 'All') {
            result = result.filter(c => c.credits === parseInt(filters.credits));
        }

        // Filter by type
        if (filters.type !== 'All') {
            const typeInt = REVERSE_COURSE_TYPE[filters.type];
            result = result.filter(c => c.type === typeInt);
        }

        // Filter by prerequisite status
        if (filters.hasPrerequisites === 'true') {
            result = result.filter(c => c.prerequisites && c.prerequisites.length > 0);
        } else if (filters.hasPrerequisites === 'false') {
            result = result.filter(c => !c.prerequisites || c.prerequisites.length === 0);
        }

        // Filter by search term
        if (filters.searchTerm) {
            const search = filters.searchTerm.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(search) ||
                c.code.toLowerCase().includes(search) ||
                c.description?.toLowerCase().includes(search)
            );
        }

        setFilteredCourses(result);
    }, [filters, courses]);

    // Check if a course is locked due to unmet prerequisites
    const isLocked = (course: any) => {
        if (!course.prerequisites || course.prerequisites.length === 0) return false;
        return !course.prerequisites.every((prereq: any) =>
            completedCourseIds.includes(prereq.id || prereq)
        );
    };

    // Handle filter changes
    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            level: 'All',
            credits: 'All',
            type: 'All',
            hasPrerequisites: 'All',
            searchTerm: ''
        });
    };


    // Extract unique credit values for filter dropdown
    const uniqueCredits = ['All', ...new Set(courses.map(c => c.credits))].sort((a: any, b: any) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a - b;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
                    <p className="text-muted-foreground mt-1">Browse and filter available courses</p>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="mb-8 border-none shadow-sm">
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                    <CardTitle className="text-xl font-bold">Filter Courses</CardTitle>
                    <Button
                        onClick={resetFilters}
                        variant="ghost"
                        size="sm"
                    >
                        Reset Filters
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="search">Search</Label>
                            <Input
                                id="search"
                                type="text"
                                placeholder="Search by title, code, or description..."
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            />
                        </div>

                        {/* Level Filter */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="level">Level</Label>
                            <Select value={filters.level} onValueChange={(val) => handleFilterChange('level', val)}>
                                <SelectTrigger id="level">
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Levels</SelectItem>
                                    <SelectItem value="Introductory">Introductory</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Credits Filter */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="credits">Credit Hours</Label>
                            <Select value={filters.credits.toString()} onValueChange={(val) => handleFilterChange('credits', val)}>
                                <SelectTrigger id="credits">
                                    <SelectValue placeholder="All Credits" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueCredits.map((credit: any) => (
                                        <SelectItem key={credit} value={credit.toString()}>
                                            {credit === 'All' ? 'All Credits' : `${credit} Credits`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Filter */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="type">Course Type</Label>
                            <Select value={filters.type} onValueChange={(val) => handleFilterChange('type', val)}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    <SelectItem value="Core">Core</SelectItem>
                                    <SelectItem value="Elective">Elective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Prerequisites Filter */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="prerequisites">Prerequisites</Label>
                            <Select value={filters.hasPrerequisites} onValueChange={(val) => handleFilterChange('hasPrerequisites', val)}>
                                <SelectTrigger id="prerequisites">
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Courses</SelectItem>
                                    <SelectItem value="false">No Prerequisites</SelectItem>
                                    <SelectItem value="true">Has Prerequisites</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            <div>
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{filteredCourses.length} Course{filteredCourses.length !== 1 ? 's' : ''} Found</h3>
                </div>

                {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                        <p className="text-muted-foreground mb-4">No courses match your current filters.</p>
                        <Button
                            onClick={resetFilters}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => {
                            const locked = isLocked(course);
                            const hasPrereqs = course.prerequisites && course.prerequisites.length > 0;

                            return (
                                <Card
                                    key={course.id}
                                    className={`transition-all hover:shadow-lg flex flex-col border-none shadow-sm ${locked ? 'opacity-75 bg-muted/30' : 'bg-white'}`}
                                >
                                    <CardContent className="p-6 flex flex-col grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-primary font-bold text-lg">{course.code}</div>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                <Badge variant={course.type === 1 ? 'default' : 'secondary'}>
                                                    {COURSE_TYPE_LABELS[course.type]}
                                                </Badge>
                                                {locked && (
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <Lock size={12} /> Locked
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 grow line-clamp-3">{course.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Level:</span>
                                                <span className="font-medium text-foreground">{DIFFICULTY_LABELS[course.difficulty]}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Credits:</span>
                                                <span className="font-medium text-foreground">{course.credits} CH</span>
                                            </div>
                                            {hasPrereqs && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Prerequisites:</span>
                                                    <span className="font-medium text-foreground text-right">
                                                        {course.prerequisites.map((prereq: any, idx: number) => (
                                                            <span key={prereq.id || prereq}>
                                                                {prereq.code || prereq}
                                                                {idx < course.prerequisites.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <Button className="w-full" asChild>
                                                <Link to={`/catalog/course/${course.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CourseCatalog;
