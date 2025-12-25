import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdService } from '@/services/pdService';
import { userService } from '@/services/userService';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Search } from 'lucide-react'

const PD_ACTIVITY_TYPE = {
    WORKSHOP: 1,
    CONFERENCE: 2,
    CERTIFICATION: 3,
    OTHER: 4
};

const ACTIVITY_TYPE_LABELS: Record<number, string> = {
    [PD_ACTIVITY_TYPE.WORKSHOP]: 'Workshop',
    [PD_ACTIVITY_TYPE.CONFERENCE]: 'Conference',
    [PD_ACTIVITY_TYPE.CERTIFICATION]: 'Certification',
    [PD_ACTIVITY_TYPE.OTHER]: 'Other'
};

const StaffPDTrackingPage = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<any[]>([]);
    const [professors, setProfessors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        professorId: '',
        title: '',
        activityType: PD_ACTIVITY_TYPE.WORKSHOP,
        date: '',
        hours: '',
        provider: '',
        notes: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [activitiesData, professorsData] = await Promise.all([
                pdService.getAllActivities(),
                userService.getProfessors()
            ]);
            setActivities(activitiesData);
            setProfessors(professorsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'activityType' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await pdService.createActivity({
                ...formData,
                hours: Number(formData.hours)
            });
            await fetchData(); // Refresh list
            handleCloseModal();
        } catch (err) {
            setError('Failed to create activity.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setError('');
    };

    const filteredActivities = activities.filter(a => {
        const matchSearch =
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.professor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
    });

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex justify-between items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/home')}>
                        ← Back to Home
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Professional Development</h1>
                        <p className="text-muted-foreground mt-1">Track and manage faculty development activities</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Activity
                    </Button>
                </header>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or professor..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Activities List */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Activity</th>
                                        <th className="px-6 py-4 font-medium">Professor</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Hours</th>
                                        <th className="px-6 py-4 font-medium">Provider</th>
                                        <th className="px-6 py-4 font-medium">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
                                    ) : filteredActivities.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No activities found.</td></tr>
                                    ) : (
                                        filteredActivities.map(activity => (
                                            <tr key={activity.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold">{activity.title}</td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                                                        {activity.professor?.name?.charAt(0)}
                                                    </div>
                                                    {activity.professor?.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline">{ACTIVITY_TYPE_LABELS[activity.activityType] || activity.activityType}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Date(activity.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {activity.hours} hrs
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{activity.provider}</td>
                                                <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={activity.notes}>
                                                    {activity.notes || '-'}
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

            {/* Add Activity Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add PD Activity</DialogTitle>
                        <DialogDescription>Record a new professional development activity.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-destructive text-sm">{error}</div>}

                        <div className="space-y-2">
                            <Label>Professor</Label>
                            <Select
                                value={formData.professorId}
                                onValueChange={(val) => handleSelectChange('professorId', val)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Professor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {professors.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Activity Title</Label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g. Advanced Teaching Methodologies"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.activityType.toString()}
                                    onValueChange={(val) => handleSelectChange('activityType', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={PD_ACTIVITY_TYPE.WORKSHOP.toString()}>Workshop</SelectItem>
                                        <SelectItem value={PD_ACTIVITY_TYPE.CONFERENCE.toString()}>Conference</SelectItem>
                                        <SelectItem value={PD_ACTIVITY_TYPE.CERTIFICATION.toString()}>Certification</SelectItem>
                                        <SelectItem value={PD_ACTIVITY_TYPE.OTHER.toString()}>Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hours</Label>
                                <Input
                                    type="number"
                                    name="hours"
                                    value={formData.hours}
                                    onChange={handleInputChange}
                                    min="0.5"
                                    step="0.5"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Provider</Label>
                                <Input
                                    name="provider"
                                    value={formData.provider}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Coursera, IEEE, University"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Additional details..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Add Activity'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffPDTrackingPage;
