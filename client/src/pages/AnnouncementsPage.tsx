import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '@/services/announcementService';
import { ArrowLeft, Megaphone, Clock, User, AlertTriangle, Info, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

function AnnouncementsPage() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAnnouncements();
            if (response.success) {
                // Sort by publishedAt descending (most recent first)
                const sorted = response.data.sort((a: Announcement, b: Announcement) => {
                    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
                    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
                    return dateB.getTime() - dateA.getTime();
                });
                setAnnouncements(sorted);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityIcon = (priority: number) => {
        switch (priority) {
            case 3: return <AlertTriangle className="h-4 w-4" />;
            case 2: return <Star className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getPriorityStyle = (priority: number) => {
        switch (priority) {
            case 3: // Urgent
                return {
                    border: 'border-l-red-500',
                    badge: 'bg-red-500 text-white',
                    bg: 'bg-red-50/50'
                };
            case 2: // High
                return {
                    border: 'border-l-orange-500',
                    badge: 'bg-orange-500 text-white',
                    bg: 'bg-orange-50/50'
                };
            case 1: // Normal
                return {
                    border: 'border-l-blue-500',
                    badge: 'bg-blue-500/10 text-blue-600',
                    bg: 'bg-blue-50/30'
                };
            default: // Low
                return {
                    border: 'border-l-gray-300',
                    badge: 'bg-gray-500/10 text-gray-600',
                    bg: 'bg-gray-50/50'
                };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-blue-50/30">
            {/* Header */}
            <div className="bg-primary/95 text-primary-foreground px-8 py-6 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Megaphone className="h-6 w-6" />
                                University Announcements
                            </h1>
                            <p className="text-primary-foreground/80 text-sm mt-1">
                                Stay informed about important updates and deadlines
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-8">
                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-8 text-center text-red-600">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{error}</p>
                        </CardContent>
                    </Card>
                ) : announcements.length === 0 ? (
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
                            <p className="text-muted-foreground">
                                There are no announcements at this time. Check back later!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement, index) => {
                            const style = getPriorityStyle(announcement.priority);
                            const isNew = index === 0;

                            return (
                                <Card
                                    key={announcement.id}
                                    className={`border-l-4 ${style.border} ${style.bg} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isNew && (
                                                    <Badge className="bg-green-500 text-white">New</Badge>
                                                )}
                                                <Badge className={style.badge}>
                                                    {getPriorityIcon(announcement.priority)}
                                                    <span className="ml-1">{announcement.priorityName}</span>
                                                </Badge>

                                            </div>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(announcement.publishedAt || announcement.createdAt)}
                                            </span>
                                        </div>

                                        <h2 className="text-xl font-semibold mb-3 text-gray-800">
                                            {announcement.title}
                                        </h2>

                                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {announcement.content}
                                        </p>

                                        {announcement.author && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                Posted by <span className="font-medium">{announcement.author.name}</span>
                                            </div>
                                        )}
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

export default AnnouncementsPage;
