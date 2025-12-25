import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Megaphone, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementsList } from "@/components/AnnouncementsList";
import { EventsList } from "@/components/EventsList";

export default function UniversityNewsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const defaultTab = searchParams.get('tab') || 'announcements';
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Update URL when tab changes, but use replace to avoid polluting history too much
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(location.search);
        params.set('tab', value);
        navigate({ search: params.toString() }, { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-blue-50/30">
            {/* Header */}
            <div className="bg-primary/95 text-primary-foreground px-8 py-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/login')}
                            className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                University Updates
                            </h1>
                            <p className="text-primary-foreground/80 text-sm mt-1">
                                Stay informed about important updates, deadlines, and events
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
                        <TabsTrigger value="announcements" className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4" />
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="events" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Events
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="announcements" className="mt-0">
                        <AnnouncementsList />
                    </TabsContent>

                    <TabsContent value="events" className="mt-0">
                        <EventsList />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
