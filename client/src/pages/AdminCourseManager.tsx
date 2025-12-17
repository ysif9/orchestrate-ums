import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService.js';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, Edit2, X } from 'lucide-react'

// Define interfaces for data structures if we were fully strict, but for now we'll use 'any' or loose typing to match JS migration style
// or inferred types.

const AdminCourseManager = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const initialFormState = {
        code: '',
        title: '',
        description: '',
        type: 'Core',
        credits: 3,
        semester: '',
        prerequisites: [] as string[]
    };
    const [formData, setFormData] = useState(initialFormState);

    // Multi-select state
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await courseService.getAll();
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (course: any = null) => {
        if (course) {
            setCurrentCourse(course);
            setFormData({
                ...course,
                prerequisites: course.prerequisites || []
            });
        } else {
            setCurrentCourse(null);
            setFormData(initialFormState);
        }
        setError('');
        setSearchTerm('');
        setIsDropdownOpen(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setError('');
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        // Validate that course is not its own prerequisite
        if (currentCourse && formData.prerequisites.includes(currentCourse.id)) {
            setError('A course cannot be its own prerequisite');
            setSubmitting(false);
            return;
        }

        const payload = {
            ...formData,
            prerequisites: formData.prerequisites
        };

        try {
            if (currentCourse) {
                await courseService.update(currentCourse.id, payload);
            } else {
                await courseService.create(payload);
            }
            await fetchCourses();
            handleCloseModal();
        } catch (error: any) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle prerequisite selection
    const handlePrerequisiteToggle = (courseId: string) => {
        setFormData(prev => {
            const isSelected = prev.prerequisites.includes(courseId);
            return {
                ...prev,
                prerequisites: isSelected
                    ? prev.prerequisites.filter(id => id !== courseId)
                    : [...prev.prerequisites, courseId]
            };
        });
    };

    const handleRemovePrerequisite = (courseId: string) => {
        setFormData(prev => ({
            ...prev,
            prerequisites: prev.prerequisites.filter(id => id !== courseId)
        }));
    };

    // Get available courses for prerequisites (excluding current course)
    const getAvailableCourses = () => {
        return courses.filter(course => {
            // Exclude current course being edited
            if (currentCourse && course.id === currentCourse.id) {
                return false;
            }
            // Filter by search term
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    course.code.toLowerCase().includes(search) ||
                    course.title.toLowerCase().includes(search)
                );
            }
            return true;
        });
    };

    // Get selected prerequisite courses
    const getSelectedPrerequisites = () => {
        return courses.filter(course =>
            formData.prerequisites.includes(course.id)
        );
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await courseService.delete(id);
                fetchCourses();
            } catch (error) {
                console.error('Delete failed', error);
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex justify-between items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/home')}
                    >
                        ← Back to Home
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                        <p className="text-muted-foreground mt-1">Create, edit, and manage university curriculum</p>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Create Course
                    </Button>
                </header>

                {/* Data Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Code</th>
                                        <th className="px-6 py-4 font-medium">Title</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Credits</th>
                                        <th className="px-6 py-4 font-medium">Semester</th>
                                        <th className="px-6 py-4 font-medium">Prerequisites</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {courses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                                No courses found. Add one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        courses.map(course => (
                                            <tr key={course.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold">{course.code}</td>
                                                <td className="px-6 py-4">{course.title}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={course.type === 'Core' ? 'default' : 'secondary'}>
                                                        {course.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">{course.credits}</td>
                                                <td className="px-6 py-4">{course.semester || 'Not set'}</td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {course.prerequisites?.length > 0
                                                        ? course.prerequisites
                                                            .map((prereq: any) => {
                                                                if (typeof prereq === 'object' && prereq.code) {
                                                                    return prereq.code;
                                                                }
                                                                const prereqCourse = courses.find(c => c.id === prereq);
                                                                return prereqCourse ? prereqCourse.code : prereq;
                                                            })
                                                            .join(', ')
                                                        : 'None'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                            onClick={() => handleOpenModal(course)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                            onClick={() => handleDelete(course.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Form */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the course below.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Course Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="e.g. CS101"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="credits">Credits</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    name="credits"
                                    value={formData.credits}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="title">Course Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Introduction to Computer Science"
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Detailed course description..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleSelectChange('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Core">Core</SelectItem>
                                        <SelectItem value="Elective">Elective</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="semester">Semester (e.g., Fall 2024)</Label>
                                <Input
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleInputChange}
                                    placeholder="Fall 2024"
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Prerequisites</Label>
                                <div className="relative border rounded-md p-4 space-y-4">
                                    {/* Selected Prerequisites */}
                                    <div className="min-h-[40px]">
                                        {getSelectedPrerequisites().length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {getSelectedPrerequisites().map(course => (
                                                    <Badge key={course.id} variant="secondary" className="pl-2 pr-1 py-1 flex gap-1 items-center">
                                                        {course.code}
                                                        <button
                                                            type="button"
                                                            className="ml-1 hover:text-destructive transition-colors"
                                                            onClick={() => handleRemovePrerequisite(course.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No prerequisites selected</span>
                                        )}
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            className="pl-9"
                                            placeholder="Search courses to add..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                    </div>

                                    {/* Dropdown List */}
                                    {isDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsDropdownOpen(false)}
                                            />
                                            <div className="absolute z-20 w-full mt-1 bg-popover border text-popover-foreground rounded-md shadow-md max-h-60 overflow-y-auto">
                                                {getAvailableCourses().length > 0 ? (
                                                    getAvailableCourses().map(course => (
                                                        <div
                                                            key={course.id}
                                                            className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 ${formData.prerequisites.includes(course.id) ? 'bg-accent/50' : ''
                                                                }`}
                                                            onClick={() => handlePrerequisiteToggle(course.id)}
                                                        >
                                                            <div className={`h-4 w-4 border rounded flex items-center justify-center ${formData.prerequisites.includes(course.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                                                                {formData.prerequisites.includes(course.id) && <Check className="h-3 w-3" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-medium text-sm">{course.code}</span>
                                                                <span className="text-sm text-muted-foreground ml-2">{course.title}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                                                        {searchTerm ? 'No courses found' : 'No courses available'}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : (currentCourse ? 'Save Changes' : 'Create Course')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Helper for check icon in dropdown
function Check({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

export default AdminCourseManager;
