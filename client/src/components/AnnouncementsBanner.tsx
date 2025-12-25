import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, AlertTriangle, Clock } from 'lucide-react';
import { announcementService } from '@/services/announcementService';

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
    priority: number;
    priorityName: string;

    publishedAt?: string | null;
    createdAt: string;
}

interface AnnouncementsBannerProps {
    maxItems?: number;
    className?: string;
}

export function AnnouncementsBanner({ maxItems = 3, className = '' }: AnnouncementsBannerProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAnnouncements();
            if (response.success) {
                // Only show published announcements, sorted by priority and date
                const published = response.data
                    .filter((a: Announcement) => a.status === 1)
                    .sort((a: Announcement, b: Announcement) => {
                        // Sort by priority (higher first) then by date (newer first)
                        if (b.priority !== a.priority) return b.priority - a.priority;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .slice(0, maxItems);
                setAnnouncements(published);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityStyles = (priority: number) => {
        switch (priority) {
            case 3: // Urgent
                return {
                    border: 'border-l-red-500',
                    badge: 'bg-red-500 text-white',
                    icon: <AlertTriangle className="h-4 w-4" />
                };
            case 2: // High
                return {
                    border: 'border-l-orange-500',
                    badge: 'bg-orange-500 text-white',
                    icon: null
                };
            default:
                return {
                    border: 'border-l-blue-500',
                    badge: 'bg-blue-500/10 text-blue-600',
                    icon: null
                };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading announcements...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (announcements.length === 0) {
        return null; // Don't show anything if there are no announcements
    }

    return (
        <Card className={`${className} overflow-hidden`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {announcements.map((announcement) => {
                        const styles = getPriorityStyles(announcement.priority);
                        const isExpanded = expanded === announcement.id;

                        return (
                            <div
                                key={announcement.id}
                                className={`p-4 border-l-4 ${styles.border} hover:bg-muted/30 transition-colors cursor-pointer`}
                                onClick={() => setExpanded(isExpanded ? null : announcement.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {announcement.priority >= 2 && (
                                                <Badge className={styles.badge}>
                                                    {styles.icon}
                                                    {announcement.priorityName}
                                                </Badge>
                                            )}
                                            <h4 className="font-semibold text-sm truncate">{announcement.title}</h4>
                                        </div>
                                        <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                                            {announcement.content}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(announcement.publishedAt || announcement.createdAt)}
                                            {announcement.author && (
                                                <>
                                                    <span>•</span>
                                                    <span>{announcement.author.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default AnnouncementsBanner;
