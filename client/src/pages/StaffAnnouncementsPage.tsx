import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '@/services/announcementService';
import { ArrowLeft, Plus, Edit2, Trash2, Send, AlertTriangle, Megaphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Announcement {
    id: number;
    title: string;
    content: string;
    author?: {
        id: number;
        name: string;
        email: string;
    };
    status: number;
    statusName: string;
    priority: number;
    priorityName: string;
    audience: number;
    audienceName: string;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    title: string;
    content: string;
    status: number;
    priority: number;
    audience: number;
    scheduledAt: string;
    expiresAt: string;
}

function StaffAnnouncementsPage() {
    const navigate = useNavigate();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        status: 0,
        priority: 1,
        audience: 0,
        scheduledAt: '',
        expiresAt: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAnnouncementsForStaff();
            if (response.success) {
                setAnnouncements(response.data);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('Failed to load announcements');
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (announcement: Announcement | null = null) => {
        if (announcement) {
            setSelectedAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                status: announcement.status,
                priority: announcement.priority,
                audience: announcement.audience,
                scheduledAt: announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().slice(0, 16) : '',
                expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : ''
            });
        } else {
            setSelectedAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                status: 0,
                priority: 1,
                audience: 0,
                scheduledAt: '',
                expiresAt: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAnnouncement(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                scheduledAt: formData.scheduledAt || null,
                expiresAt: formData.expiresAt || null
            };

            if (selectedAnnouncement) {
                await announcementService.updateAnnouncement(selectedAnnouncement.id, payload);
                toast.success('Announcement updated successfully');
            } else {
                await announcementService.createAnnouncement(payload);
                toast.success('Announcement created successfully');
            }
            handleCloseModal();
            fetchAnnouncements();
        } catch (err: unknown) {
            console.error('Error saving announcement:', err);
            const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save announcement';
            toast.error(errorMessage);
        }
    };

    const handlePublish = async (id: number) => {
        try {
            await announcementService.publishAnnouncement(id);
            toast.success('Announcement published successfully');
            fetchAnnouncements();
        } catch (err) {
            console.error('Error publishing announcement:', err);
            toast.error('Failed to publish announcement');
        }
    };

    const handleDelete = async () => {
        if (!selectedAnnouncement) return;
        try {
            await announcementService.deleteAnnouncement(selectedAnnouncement.id);
            toast.success('Announcement deleted successfully');
            setIsDeleteModalOpen(false);
            setSelectedAnnouncement(null);
            fetchAnnouncements();
        } catch (err) {
            console.error('Error deleting announcement:', err);
            toast.error('Failed to delete announcement');
        }
    };

    const openDeleteModal = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsDeleteModalOpen(true);
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
            case 1: return <Badge className="bg-green-500 text-white">Published</Badge>;
            case 2: return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
            case 3: return <Badge variant="outline" className="bg-gray-300 text-gray-600">Archived</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getPriorityBadge = (priority: number) => {
        switch (priority) {
            case 0: return <Badge variant="outline" className="border-gray-400 text-gray-600">Low</Badge>;
            case 1: return <Badge variant="outline" className="border-blue-400 text-blue-600">Normal</Badge>;
            case 2: return <Badge className="bg-orange-500 text-white">High</Badge>;
            case 3: return <Badge className="bg-red-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Urgent</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getAudienceBadge = (audience: number) => {
        const names = ['All Users', 'Students', 'Staff', 'Professors', 'Parents'];
        return <Badge variant="secondary">{names[audience] || 'Unknown'}</Badge>;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin')}
                            className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
                            <Megaphone className="h-6 w-6" />
                            Announcements Management
                        </h1>
                    </div>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Announcement
                    </Button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {announcements.filter(a => a.status === 1).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Published</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-gray-400">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-gray-600">
                                {announcements.filter(a => a.status === 0).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Drafts</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">
                                {announcements.filter(a => a.status === 2).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Scheduled</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">
                                {announcements.filter(a => a.priority >= 2).length}
                            </div>
                            <div className="text-sm text-muted-foreground">High Priority</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Announcements List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-8 text-center text-red-600">
                            {error}
                        </CardContent>
                    </Card>
                ) : announcements.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first announcement to communicate with the university community.</p>
                            <Button onClick={() => handleOpenModal()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Announcement
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {getStatusBadge(announcement.status)}
                                                {getPriorityBadge(announcement.priority)}
                                                {getAudienceBadge(announcement.audience)}
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                                            <p className="text-muted-foreground line-clamp-2 mb-3">{announcement.content}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>By: {announcement.author?.name}</span>
                                                <span>•</span>
                                                <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                {announcement.publishedAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            {announcement.status === 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePublish(announcement.id)}
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                >
                                                    <Send className="h-4 w-4 mr-1" />
                                                    Publish
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenModal(announcement)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteModal(announcement)}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedAnnouncement
                                ? 'Update the announcement details below.'
                                : 'Create a new announcement to share with the university community.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter announcement title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter announcement content..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, status: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Draft</SelectItem>
                                            <SelectItem value="1">Published</SelectItem>
                                            <SelectItem value="2">Scheduled</SelectItem>
                                            <SelectItem value="3">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={formData.priority.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Low</SelectItem>
                                            <SelectItem value="1">Normal</SelectItem>
                                            <SelectItem value="2">High</SelectItem>
                                            <SelectItem value="3">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="audience">Target Audience</Label>
                                <Select
                                    value={formData.audience.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, audience: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Users</SelectItem>
                                        <SelectItem value="1">Students Only</SelectItem>
                                        <SelectItem value="2">Staff Only</SelectItem>
                                        <SelectItem value="3">Professors Only</SelectItem>
                                        <SelectItem value="4">Parents Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduledAt">Schedule For (Optional)</Label>
                                    <Input
                                        id="scheduledAt"
                                        type="datetime-local"
                                        value={formData.scheduledAt}
                                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                    <Input
                                        id="expiresAt"
                                        type="datetime-local"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedAnnouncement ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Announcement</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default StaffAnnouncementsPage;
