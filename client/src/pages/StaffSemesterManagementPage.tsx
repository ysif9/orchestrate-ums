import { useState, useEffect } from 'react';
import { semesterService } from '@/services/semesterService';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Edit2, Play, CheckCircle, AlertCircle } from 'lucide-react'

const SEMESTER_STATUS = {
    ACTIVE: 1,
    INACTIVE: 2,
    FINALIZED: 3
};

const StaffSemesterManagementPage = () => {
    const [semesters, setSemesters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
    const [semesterToFinalize, setSemesterToFinalize] = useState<any>(null);
    const [finalizeError, setFinalizeError] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const initialFormState = {
        name: '',
        startDate: '',
        endDate: '',
        dropDate: '',
        status: SEMESTER_STATUS.INACTIVE
    };
    const [formData, setFormData] = useState(initialFormState);
    const [currentSemester, setCurrentSemester] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await semesterService.getAll();
            setSemesters(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load semesters');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (semester: any = null) => {
        if (semester) {
            setCurrentSemester(semester);
            // Format dates for input fields (YYYY-MM-DD)
            const startDate = new Date(semester.startDate).toISOString().split('T')[0];
            const endDate = new Date(semester.endDate).toISOString().split('T')[0];
            const dropDate = semester.dropDate ? new Date(semester.dropDate).toISOString().split('T')[0] : '';
            setFormData({
                name: semester.name,
                startDate,
                endDate,
                dropDate,
                status: semester.status
            });
        } else {
            setCurrentSemester(null);
            setFormData(initialFormState);
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setCurrentSemester(null);
        setError('');
        setSuccessMessage('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        try {
            if (currentSemester) {
                await semesterService.update(currentSemester.id, formData);
                setSuccessMessage('Semester updated successfully');
            } else {
                await semesterService.create(formData);
                setSuccessMessage('Semester created and automatically activated successfully');
            }
            await fetchData();
            handleCloseModal();
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            console.error('Error saving semester:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save semester';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async (semester: any) => {
        if (semester.status === SEMESTER_STATUS.FINALIZED) {
            setError('Cannot activate a finalized semester');
            return;
        }

        try {
            await semesterService.activate(semester.id);
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate semester');
        }
    };

    const handleFinalizeClick = (semester: any) => {
        if (semester.status === SEMESTER_STATUS.FINALIZED) {
            setError('Semester is already finalized');
            return;
        }
        setSemesterToFinalize(semester);
        setFinalizeError(null);
        setIsFinalizeDialogOpen(true);
    };

    const handleFinalize = async () => {
        if (!semesterToFinalize) return;

        setSubmitting(true);
        setFinalizeError(null);

        try {
            await semesterService.finalize(semesterToFinalize.id);
            setIsFinalizeDialogOpen(false);
            setSemesterToFinalize(null);
            await fetchData();
        } catch (err: any) {
            if (err.response?.data?.missingGrades) {
                setFinalizeError(err.response.data);
            } else {
                setFinalizeError({ message: err.response?.data?.message || 'Failed to finalize semester' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: number) => {
        const variants: { [key: number]: string } = {
            [SEMESTER_STATUS.ACTIVE]: 'default',
            [SEMESTER_STATUS.INACTIVE]: 'secondary',
            [SEMESTER_STATUS.FINALIZED]: 'outline'
        };
        const colors: { [key: number]: string } = {
            [SEMESTER_STATUS.ACTIVE]: 'bg-green-500',
            [SEMESTER_STATUS.INACTIVE]: 'bg-gray-500',
            [SEMESTER_STATUS.FINALIZED]: 'bg-blue-500'
        };

        const labels: { [key: number]: string } = {
            [SEMESTER_STATUS.ACTIVE]: 'Active',
            [SEMESTER_STATUS.INACTIVE]: 'Inactive',
            [SEMESTER_STATUS.FINALIZED]: 'Finalized'
        };

        return (
            <Badge variant={variants[status] as any} className={colors[status]}>
                {labels[status]}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">Loading semesters...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Semester Management</h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Semester
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-500/15 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
                    {successMessage}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Semesters</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {semesters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No semesters found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                semesters.map((semester) => (
                                    <TableRow
                                        key={semester.id}
                                        className={semester.status === SEMESTER_STATUS.ACTIVE ? 'bg-green-50 dark:bg-green-950/20' : ''}
                                    >
                                        <TableCell className="font-medium">
                                            {semester.name}
                                            {semester.status === SEMESTER_STATUS.ACTIVE && (
                                                <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                                                    (Currently Active)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(semester.startDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(semester.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(semester.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {semester.status !== SEMESTER_STATUS.FINALIZED && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenModal(semester)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {semester.status !== SEMESTER_STATUS.ACTIVE && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleActivate(semester)}
                                                            >
                                                                <Play className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleFinalizeClick(semester)}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {currentSemester ? 'Edit Semester' : 'Create New Semester'}
                        </DialogTitle>
                        <DialogDescription>
                            {currentSemester
                                ? 'Update semester information below.'
                                : 'Create a new academic semester with start and end dates. The new semester will be automatically activated and will deactivate any currently active semester.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Semester Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Fall 2025"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dropDate">Drop Date (Optional)</Label>
                                <Input
                                    id="dropDate"
                                    name="dropDate"
                                    type="date"
                                    value={formData.dropDate}
                                    onChange={handleInputChange}
                                    placeholder="Last date students can drop courses"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Last date students can drop courses for this semester. Leave empty if not set.
                                </p>
                            </div>
                            {currentSemester && currentSemester.status !== SEMESTER_STATUS.FINALIZED && (
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status.toString()}
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={SEMESTER_STATUS.INACTIVE.toString()}>Inactive</SelectItem>
                                            <SelectItem value={SEMESTER_STATUS.ACTIVE.toString()}>Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        {error && (
                            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                                {error}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : currentSemester ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Finalize Confirmation Dialog */}
            <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
                <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalize Semester</AlertDialogTitle>
                        <AlertDialogDescription>
                            {semesterToFinalize && (
                                <>
                                    Are you sure you want to finalize <strong>{semesterToFinalize.name}</strong>?
                                    <br />
                                    <br />
                                    This will:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Mark all active enrollments as "Completed"</li>
                                        <li>Lock the semester from further changes</li>
                                        <li>Make completed courses appear in student transcripts</li>
                                    </ul>
                                    <br />
                                    <strong>Note:</strong> All assessments must have grades for all enrolled students before finalization.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {finalizeError && (
                        <div className="mt-4 space-y-2">
                            {finalizeError.missingGrades ? (
                                <div className="bg-destructive/15 border border-destructive/50 rounded-md p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-destructive mb-2">
                                                Cannot finalize: Missing grades detected
                                            </p>
                                            <p className="text-sm mb-3">
                                                The following students are missing grades for assessments:
                                            </p>
                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {finalizeError.missingGrades.map((item: any, idx: number) => (
                                                    <div key={idx} className="text-sm bg-background p-2 rounded border">
                                                        <strong>{item.studentName}</strong> - {item.courseCode} ({item.courseTitle})
                                                        <br />
                                                        Missing: <strong>{item.assessmentTitle}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                                    {finalizeError.message || 'Failed to finalize semester'}
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsFinalizeDialogOpen(false);
                            setFinalizeError(null);
                            setSemesterToFinalize(null);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        {!finalizeError?.missingGrades && (
                            <AlertDialogAction
                                onClick={handleFinalize}
                                disabled={submitting}
                                className="bg-primary"
                            >
                                {submitting ? 'Finalizing...' : 'Finalize Semester'}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default StaffSemesterManagementPage;

