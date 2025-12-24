import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '@/services/announcementService';
import { eventService } from '@/services/eventService';
import { ArrowLeft, Plus, Edit2, Trash2, Send, AlertTriangle, Megaphone, Calendar, MapPin, Clock, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Event {
    id: number;
    title: string;
    description: string;
    organizer?: {
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
    startDate: string;
    endDate: string;
    location?: string | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface AnnouncementFormData {
    title: string;
    content: string;
    status: number;
    priority: number;
    audience: number;
    scheduledAt: string;
    expiresAt: string;
}

interface EventFormData {
    title: string;
    description: string;
    status: number;
    priority: number;
    audience: number;
    startDate: string;
    endDate: string;
    location: string;
}

function StaffAnnouncementsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');

    // Announcements state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementLoading, setAnnouncementLoading] = useState(true);
    const [announcementError, setAnnouncementError] = useState<string | null>(null);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isAnnouncementDeleteModalOpen, setIsAnnouncementDeleteModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [announcementFormData, setAnnouncementFormData] = useState<AnnouncementFormData>({
        title: '',
        content: '',
        status: 0,
        priority: 1,
        audience: 0,
        scheduledAt: '',
        expiresAt: ''
    });

    // Events state
    const [events, setEvents] = useState<Event[]>([]);
    const [eventLoading, setEventLoading] = useState(true);
    const [eventError, setEventError] = useState<string | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isEventDeleteModalOpen, setIsEventDeleteModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [eventFormData, setEventFormData] = useState<EventFormData>({
        title: '',
        description: '',
        status: 0,
        priority: 1,
        audience: 0,
        startDate: '',
        endDate: '',
        location: ''
    });

    useEffect(() => {
        fetchAnnouncements();
        fetchEvents();
    }, []);

    // ===================== ANNOUNCEMENTS FUNCTIONS =====================
    const fetchAnnouncements = async () => {
        try {
            setAnnouncementLoading(true);
            const response = await announcementService.getAnnouncementsForStaff();
            if (response.success) {
                setAnnouncements(response.data);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setAnnouncementError('Failed to load announcements');
        } finally {
            setAnnouncementLoading(false);
        }
    };

    const handleOpenAnnouncementModal = (announcement: Announcement | null = null) => {
        if (announcement) {
            setSelectedAnnouncement(announcement);
            setAnnouncementFormData({
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
            setAnnouncementFormData({
                title: '',
                content: '',
                status: 0,
                priority: 1,
                audience: 0,
                scheduledAt: '',
                expiresAt: ''
            });
        }
        setIsAnnouncementModalOpen(true);
    };

    const handleAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...announcementFormData,
                scheduledAt: announcementFormData.scheduledAt || null,
                expiresAt: announcementFormData.expiresAt || null
            };

            if (selectedAnnouncement) {
                await announcementService.updateAnnouncement(selectedAnnouncement.id, payload);
                toast.success('Announcement updated successfully');
            } else {
                await announcementService.createAnnouncement(payload);
                toast.success('Announcement created successfully');
            }
            setIsAnnouncementModalOpen(false);
            setSelectedAnnouncement(null);
            fetchAnnouncements();
        } catch (err: unknown) {
            console.error('Error saving announcement:', err);
            const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save announcement';
            toast.error(errorMessage);
        }
    };

    const handlePublishAnnouncement = async (id: number) => {
        try {
            await announcementService.publishAnnouncement(id);
            toast.success('Announcement published successfully');
            fetchAnnouncements();
        } catch (err) {
            console.error('Error publishing announcement:', err);
            toast.error('Failed to publish announcement');
        }
    };

    const handleDeleteAnnouncement = async () => {
        if (!selectedAnnouncement) return;
        try {
            await announcementService.deleteAnnouncement(selectedAnnouncement.id);
            toast.success('Announcement deleted successfully');
            setIsAnnouncementDeleteModalOpen(false);
            setSelectedAnnouncement(null);
            fetchAnnouncements();
        } catch (err) {
            console.error('Error deleting announcement:', err);
            toast.error('Failed to delete announcement');
        }
    };

    // ===================== EVENTS FUNCTIONS =====================
    const fetchEvents = async () => {
        try {
            setEventLoading(true);
            const response = await eventService.getEventsForStaff();
            if (response.success) {
                setEvents(response.data);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setEventError('Failed to load events');
        } finally {
            setEventLoading(false);
        }
    };

    const handleOpenEventModal = (event: Event | null = null) => {
        if (event) {
            setSelectedEvent(event);
            setEventFormData({
                title: event.title,
                description: event.description,
                status: event.status,
                priority: event.priority,
                audience: event.audience,
                startDate: new Date(event.startDate).toISOString().slice(0, 16),
                endDate: new Date(event.endDate).toISOString().slice(0, 16),
                location: event.location || ''
            });
        } else {
            setSelectedEvent(null);
            setEventFormData({
                title: '',
                description: '',
                status: 0,
                priority: 1,
                audience: 0,
                startDate: '',
                endDate: '',
                location: ''
            });
        }
        setIsEventModalOpen(true);
    };

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...eventFormData,
                location: eventFormData.location || null
            };

            if (selectedEvent) {
                await eventService.updateEvent(selectedEvent.id, payload);
                toast.success('Event updated successfully');
            } else {
                await eventService.createEvent(payload);
                toast.success('Event created successfully');
            }
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            fetchEvents();
        } catch (err: unknown) {
            console.error('Error saving event:', err);
            const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save event';
            toast.error(errorMessage);
        }
    };

    const handlePublishEvent = async (id: number) => {
        try {
            await eventService.publishEvent(id);
            toast.success('Event published successfully');
            fetchEvents();
        } catch (err) {
            console.error('Error publishing event:', err);
            toast.error('Failed to publish event');
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        try {
            await eventService.deleteEvent(selectedEvent.id);
            toast.success('Event deleted successfully');
            setIsEventDeleteModalOpen(false);
            setSelectedEvent(null);
            fetchEvents();
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error('Failed to delete event');
        }
    };

    // ===================== BADGE HELPERS =====================
    const getAnnouncementStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
            case 1: return <Badge className="bg-green-500 text-white">Published</Badge>;
            case 2: return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
            case 3: return <Badge variant="outline" className="bg-gray-300 text-gray-600">Archived</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getEventStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
            case 1: return <Badge className="bg-green-500 text-white">Published</Badge>;
            case 2: return <Badge className="bg-blue-500 text-white">Ongoing</Badge>;
            case 3: return <Badge variant="outline" className="bg-gray-300 text-gray-600">Completed</Badge>;
            case 4: return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getPriorityBadge = (priority: number, isEvent: boolean = false) => {
        switch (priority) {
            case 0: return <Badge variant="outline" className="border-gray-400 text-gray-600">Low</Badge>;
            case 1: return <Badge variant="outline" className="border-blue-400 text-blue-600">Normal</Badge>;
            case 2: return <Badge className="bg-orange-500 text-white">High</Badge>;
            case 3: return isEvent
                ? <Badge className="bg-purple-500 text-white"><Star className="w-3 h-3 mr-1" />Featured</Badge>
                : <Badge className="bg-red-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Urgent</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getAudienceBadge = (audience: number) => {
        const names = ['All Users', 'Students', 'Staff', 'Professors', 'Parents'];
        return <Badge variant="secondary">{names[audience] || 'Unknown'}</Badge>;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
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
                            {activeTab === 'announcements' ? (
                                <><Megaphone className="h-6 w-6" /> Announcements & Events</>
                            ) : (
                                <><Calendar className="h-6 w-6" /> Announcements & Events</>
                            )}
                        </h1>
                    </div>
                    <Button
                        onClick={() => activeTab === 'announcements' ? handleOpenAnnouncementModal() : handleOpenEventModal()}
                        className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New {activeTab === 'announcements' ? 'Announcement' : 'Event'}
                    </Button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'announcements' | 'events')} className="mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="announcements" className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4" />
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="events" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Events
                        </TabsTrigger>
                    </TabsList>

                    {/* ANNOUNCEMENTS TAB */}
                    <TabsContent value="announcements">
                        {/* Announcements Stats */}
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
                        {announcementLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : announcementError ? (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="p-8 text-center text-red-600">
                                    {announcementError}
                                </CardContent>
                            </Card>
                        ) : announcements.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="p-12 text-center">
                                    <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first announcement to communicate with the university community.</p>
                                    <Button onClick={() => handleOpenAnnouncementModal()}>
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
                                                        {getAnnouncementStatusBadge(announcement.status)}
                                                        {getPriorityBadge(announcement.priority)}
                                                        {getAudienceBadge(announcement.audience)}
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                                                    <p className="text-muted-foreground line-clamp-2 mb-3">{announcement.content}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>By: {announcement.author?.name}</span>
                                                        <span>•</span>
                                                        <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    {announcement.status === 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePublishAnnouncement(announcement.id)}
                                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                                        >
                                                            <Send className="h-4 w-4 mr-1" />
                                                            Publish
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenAnnouncementModal(announcement)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAnnouncement(announcement);
                                                            setIsAnnouncementDeleteModalOpen(true);
                                                        }}
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
                    </TabsContent>

                    {/* EVENTS TAB */}
                    <TabsContent value="events">
                        {/* Events Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {events.filter(e => e.status === 1 || e.status === 2).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Active Events</div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-gray-400">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {events.filter(e => e.status === 0).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Drafts</div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {events.filter(e => e.status === 3).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Completed</div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-purple-500">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {events.filter(e => e.priority === 3).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Featured</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Events List */}
                        {eventLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : eventError ? (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="p-8 text-center text-red-600">
                                    {eventError}
                                </CardContent>
                            </Card>
                        ) : events.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="p-12 text-center">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first event to inform the university community.</p>
                                    <Button onClick={() => handleOpenEventModal()}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        {getEventStatusBadge(event.status)}
                                                        {getPriorityBadge(event.priority, true)}
                                                        {getAudienceBadge(event.audience)}
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                                                    <p className="text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
                                                        </span>
                                                        {event.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <span>Organizer: {event.organizer?.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    {event.status === 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePublishEvent(event.id)}
                                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                                        >
                                                            <Send className="h-4 w-4 mr-1" />
                                                            Publish
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenEventModal(event)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedEvent(event);
                                                            setIsEventDeleteModalOpen(true);
                                                        }}
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
                    </TabsContent>
                </Tabs>
            </div>

            {/* Announcement Create/Edit Modal */}
            <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
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
                    <form onSubmit={handleAnnouncementSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="ann-title">Title *</Label>
                                <Input
                                    id="ann-title"
                                    value={announcementFormData.title}
                                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                                    placeholder="Enter announcement title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ann-content">Content *</Label>
                                <Textarea
                                    id="ann-content"
                                    value={announcementFormData.content}
                                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                                    placeholder="Enter announcement content..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={announcementFormData.status.toString()}
                                        onValueChange={(value) => setAnnouncementFormData({ ...announcementFormData, status: parseInt(value) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Draft</SelectItem>
                                            <SelectItem value="1">Published</SelectItem>
                                            <SelectItem value="2">Scheduled</SelectItem>
                                            <SelectItem value="3">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={announcementFormData.priority.toString()}
                                        onValueChange={(value) => setAnnouncementFormData({ ...announcementFormData, priority: parseInt(value) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <Label>Target Audience</Label>
                                <Select
                                    value={announcementFormData.audience.toString()}
                                    onValueChange={(value) => setAnnouncementFormData({ ...announcementFormData, audience: parseInt(value) })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Label htmlFor="ann-scheduledAt">Schedule For (Optional)</Label>
                                    <Input
                                        id="ann-scheduledAt"
                                        type="datetime-local"
                                        value={announcementFormData.scheduledAt}
                                        onChange={(e) => setAnnouncementFormData({ ...announcementFormData, scheduledAt: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ann-expiresAt">Expires At (Optional)</Label>
                                    <Input
                                        id="ann-expiresAt"
                                        type="datetime-local"
                                        value={announcementFormData.expiresAt}
                                        onChange={(e) => setAnnouncementFormData({ ...announcementFormData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{selectedAnnouncement ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Announcement Delete Modal */}
            <Dialog open={isAnnouncementDeleteModalOpen} onOpenChange={setIsAnnouncementDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Announcement</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAnnouncementDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAnnouncement}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Event Create/Edit Modal */}
            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEvent ? 'Edit Event' : 'Create Event'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent
                                ? 'Update the event details below.'
                                : 'Create a new event to inform the university community.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="event-title">Title *</Label>
                                <Input
                                    id="event-title"
                                    value={eventFormData.title}
                                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                    placeholder="Enter event title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-description">Description *</Label>
                                <Textarea
                                    id="event-description"
                                    value={eventFormData.description}
                                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                    placeholder="Enter event description..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event-startDate">Start Date & Time *</Label>
                                    <Input
                                        id="event-startDate"
                                        type="datetime-local"
                                        value={eventFormData.startDate}
                                        onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="event-endDate">End Date & Time *</Label>
                                    <Input
                                        id="event-endDate"
                                        type="datetime-local"
                                        value={eventFormData.endDate}
                                        onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-location">Location (Optional)</Label>
                                <Input
                                    id="event-location"
                                    value={eventFormData.location}
                                    onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                                    placeholder="e.g., Main Auditorium, Room 101"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={eventFormData.status.toString()}
                                        onValueChange={(value) => setEventFormData({ ...eventFormData, status: parseInt(value) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Draft</SelectItem>
                                            <SelectItem value="1">Published</SelectItem>
                                            <SelectItem value="2">Ongoing</SelectItem>
                                            <SelectItem value="3">Completed</SelectItem>
                                            <SelectItem value="4">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={eventFormData.priority.toString()}
                                        onValueChange={(value) => setEventFormData({ ...eventFormData, priority: parseInt(value) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Low</SelectItem>
                                            <SelectItem value="1">Normal</SelectItem>
                                            <SelectItem value="2">High</SelectItem>
                                            <SelectItem value="3">Featured</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Select
                                    value={eventFormData.audience.toString()}
                                    onValueChange={(value) => setEventFormData({ ...eventFormData, audience: parseInt(value) })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Users</SelectItem>
                                        <SelectItem value="1">Students Only</SelectItem>
                                        <SelectItem value="2">Staff Only</SelectItem>
                                        <SelectItem value="3">Professors Only</SelectItem>
                                        <SelectItem value="4">Parents Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{selectedEvent ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Event Delete Modal */}
            <Dialog open={isEventDeleteModalOpen} onOpenChange={setIsEventDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEventDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteEvent}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default StaffAnnouncementsPage;
