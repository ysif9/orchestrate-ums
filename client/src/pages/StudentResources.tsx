import { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService.js';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, AlertCircle, Loader2, CheckCircle, Clock } from 'lucide-react';
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

export default function StudentResources() {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [returningId, setReturningId] = useState<string | null>(null);
    const [returnError, setReturnError] = useState('');

    // Alert Dialog State
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

    useEffect(() => {
        fetchMyAllocations();
    }, []);

    const fetchMyAllocations = async () => {
        setLoading(true);
        try {
            const data = await resourceService.getMyAllocations();
            setAllocations(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load your allocated resources');
        } finally {
            setLoading(false);
        }
    };

    const confirmReturn = (allocationId: string) => {
        setSelectedAllocationId(allocationId);
        setIsReturnDialogOpen(true);
    }

    const handleReturn = async () => {
        if (!selectedAllocationId) return;

        setReturningId(selectedAllocationId);
        setReturnError('');
        setIsReturnDialogOpen(false); // Close dialog immediately or wait? better close, show loading state on button

        try {
            // Use allocation-based return endpoint
            await resourceService.returnResource(selectedAllocationId);

            // remove returned allocation from UI
            setAllocations(prev => prev.filter(a => a.id !== selectedAllocationId));
            // Optionally show success toast/message
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.message || 'Failed to return resource. Please contact staff.';
            setReturnError(message);
        } finally {
            setReturningId(null);
            setSelectedAllocationId(null);
        }
    };

    const getDaysRemaining = (dueDate: string) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading your resources...
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Allocated Resources</h1>
                        <p className="text-muted-foreground">View and manage resources assigned to you</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {returnError && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {returnError}
                    </div>
                )}

                {allocations.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-lg font-semibold mb-2">No Resources Allocated</h3>
                            <p className="text-muted-foreground mb-4">You don't have any resources allocated to you yet. Resources will appear here once assigned by staff.</p>
                            <p className="text-xs text-muted-foreground">Need equipment or software? Contact your department office.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Showing <span className="font-semibold text-foreground">{allocations.length}</span> allocated resource{allocations.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="grid gap-6">
                            {allocations.map((allocation) => {
                                const daysRemaining = getDaysRemaining(allocation.dueDate);
                                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                                const dueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;
                                const statusColor = isOverdue ? "text-destructive" : dueSoon ? "text-amber-600" : "text-green-600";

                                return (
                                    <Card key={allocation.id} className="overflow-hidden">
                                        <CardHeader className="pb-3 bg-muted/30">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-xl">{allocation.resource?.name}</CardTitle>
                                                        <Badge variant="outline" className="capitalize font-normal text-xs bg-background">
                                                            {allocation.resource?.type?.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        {allocation.allocatedAt && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" /> Allocated: {formatDate(allocation.allocatedAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={allocation.status === 'active' ? "default" : "secondary"} className={allocation.status === 'active' ? "bg-green-600 hover:bg-green-700" : ""}>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {allocation.status?.charAt(0).toUpperCase() + allocation.status?.slice(1)}
                                                    </Badge>

                                                    {allocation.dueDate && (
                                                        <div className={`text-xs font-medium flex items-center gap-1 ${statusColor}`}>
                                                            <Clock className="w-3 h-3" />
                                                            {isOverdue
                                                                ? `Overdue by ${Math.abs(daysRemaining!)} day${Math.abs(daysRemaining!) !== 1 ? 's' : ''}`
                                                                : dueSoon
                                                                    ? `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                                                                    : `Due: ${formatDate(allocation.dueDate)}`
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            {allocation.resource?.description && (
                                                <p className="text-muted-foreground text-sm mb-4">
                                                    {allocation.resource.description}
                                                </p>
                                            )}

                                            {allocation.resource?.attributes?.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {allocation.resource.attributes.map((attr: any, idx: number) => (
                                                        <div key={idx} className="bg-muted/50 p-2.5 rounded-lg text-sm">
                                                            <span className="text-muted-foreground text-xs block mb-0.5">{attr.attribute?.label || 'Detail'}</span>
                                                            <span className="font-medium text-foreground">
                                                                {attr.stringValue || (attr.numberValue !== undefined ? attr.numberValue.toString() : '') || (attr.dateValue ? formatDate(attr.dateValue) : '') || (attr.booleanValue !== undefined ? (attr.booleanValue ? 'Yes' : 'No') : 'N/A')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {allocation.notes && (
                                                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                                                    <span className="font-semibold block mb-0.5">Note:</span>
                                                    {allocation.notes}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="bg-muted/30 border-t py-4 flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                ID: #{allocation.id}
                                            </span>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => alert(`Details for: ${allocation.resource?.name}`)}>
                                                    View Details
                                                </Button>
                                                {allocation.status === 'active' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => confirmReturn(allocation.id)}
                                                        disabled={returningId === allocation.id}
                                                    >
                                                        {returningId === allocation.id ? (
                                                            <><Loader2 className="w-3 h-3 animate-spin mr-2" /> Returning...</>
                                                        ) : (
                                                            'Return Resource'
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Info Footnote */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm">Resource Usage Guidelines</h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-0.5">
                                <li>Return resources promptly by the due date.</li>
                                <li>Report any issues or damages immediately to the facilities office.</li>
                                <li>Equipment must be used in designated areas only.</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>

            {/* Return Confirmation Dialog */}
            <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Return Resource?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to return this resource? This action will mark the allocation as returned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReturn}>Confirm Return</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
