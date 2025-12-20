import { useState, useEffect } from 'react';
import { staffDirectoryService } from '../services/staffDirectoryService';
import { evaluationService } from '../services/evaluationService';
import { authService } from '../services/authService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, User as UserIcon, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StaffPerformanceManagementPage() {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState<any[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEvaluations, setLoadingEvaluations] = useState(false);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [ratingTeaching, setRatingTeaching] = useState(5);
    const [ratingResearch, setRatingResearch] = useState(5);
    const [ratingService, setRatingService] = useState(5);
    const [comments, setComments] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (selectedStaff) {
            fetchEvaluations(selectedStaff.id);
        } else {
            setEvaluations([]);
        }
    }, [selectedStaff]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await staffDirectoryService.getAll();
            // Filter to show only Professor and TA roles if needed, though getAll usually returns them.
            setStaffList(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvaluations = async (facultyId: string) => {
        setLoadingEvaluations(true);
        try {
            const data = await evaluationService.getFacultyEvaluations(facultyId);
            setEvaluations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingEvaluations(false);
        }
    };

    const handleCreateEvaluation = async () => {
        if (!selectedStaff) return;
        setSaving(true);
        try {
            const user = authService.getCurrentUser() as any;
            await evaluationService.createEvaluation({
                evaluatorId: user.id,
                evaluateeId: selectedStaff.id,
                date: new Date(),
                ratings: {
                    teaching: ratingTeaching,
                    research: ratingResearch,
                    service: ratingService
                },
                comments
            });
            setIsDialogOpen(false);
            fetchEvaluations(selectedStaff.id);
            // Reset form
            setComments('');
            setRatingTeaching(5);
            setRatingResearch(5);
            setRatingService(5);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to save evaluation');
        } finally {
            setSaving(false);
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/home')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-3xl font-bold">Performance Management</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[800px]">
                {/* Staff List Sidebar */}
                <Card className="md:col-span-1 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Faculty Directory</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search faculty..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No faculty found.</div>
                        ) : (
                            <div className="space-y-2">
                                {filteredStaff.map(staff => (
                                    <div
                                        key={staff.id}
                                        onClick={() => setSelectedStaff(staff)}
                                        className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedStaff?.id === staff.id
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                            <UserIcon className="h-5 w-5 text-secondary-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{staff.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{staff.role.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <Card className="md:col-span-2 h-full flex flex-col">
                    {selectedStaff ? (
                        <>
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div>
                                    <CardTitle className="text-xl">{selectedStaff.name}</CardTitle>
                                    <CardDescription>{selectedStaff.email} • {selectedStaff.role.replace('_', ' ')}</CardDescription>
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Evaluation
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>New Performance Evaluation</DialogTitle>
                                            <DialogDescription>
                                                Create a new evaluation for {selectedStaff.name}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Teaching</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={ratingTeaching}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setRatingTeaching(Math.min(Math.max(value, 1), 5));
                                                    }}
                                                    className="col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Research</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={ratingResearch}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setRatingResearch(Math.min(Math.max(value, 1), 5));
                                                    }}
                                                    className="col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Service</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={ratingService}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setRatingService(Math.min(Math.max(value, 1), 5));
                                                    }}
                                                    className="col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-start gap-4">
                                                <Label className="text-right pt-2">Comments</Label>
                                                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} className="col-span-3" rows={4} placeholder="Detailed feedback..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                            <Button type="button" onClick={handleCreateEvaluation} disabled={saving}>{saving ? 'Saving...' : 'Save Evaluation'}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto pt-6">
                                <h3 className="text-lg font-semibold mb-4">Evaluation History</h3>
                                {loadingEvaluations ? (
                                    <div className="text-center py-8">Loading evaluations...</div>
                                ) : evaluations.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No evaluations recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {evaluations.map((evalItem) => (
                                            <Card key={evalItem.id} className="overflow-hidden">
                                                <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{new Date(evalItem.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Evaluator: {evalItem.evaluator?.name || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                                                            <div className="text-sm text-muted-foreground mb-1">Teaching</div>
                                                            <div className="font-bold text-xl text-primary">{evalItem.ratings?.teaching || '-'} / 5</div>
                                                        </div>
                                                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                                                            <div className="text-sm text-muted-foreground mb-1">Research</div>
                                                            <div className="font-bold text-xl text-primary">{evalItem.ratings?.research || '-'} / 5</div>
                                                        </div>
                                                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                                                            <div className="text-sm text-muted-foreground mb-1">Service</div>
                                                            <div className="font-bold text-xl text-primary">{evalItem.ratings?.service || '-'} / 5</div>
                                                        </div>
                                                    </div>
                                                    {evalItem.comments && (
                                                        <div className="bg-muted/20 p-4 rounded-lg">
                                                            <p className="text-sm italic text-muted-foreground">"{evalItem.comments}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <UserIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg">Select a faculty member to view performance details.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
