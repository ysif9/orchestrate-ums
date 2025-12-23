import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceService } from '../services/resourceService.js';
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
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Package, AlertCircle, Loader2, CheckCircle, XCircle, Trash2, ArrowLeft } from 'lucide-react';

// Helper function to convert ResourceType enum (number) to display string
const getResourceTypeLabel = (type: number | undefined): string => {
    switch (type) {
        case 1:
            return 'Equipment';
        case 2:
            return 'Software License';
        case 3:
            return 'Other';
        default:
            return 'Unknown';
    }
};

export default function AllocateResources() {
    const navigate = useNavigate();
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAllocating, setIsAllocating] = useState(false);
    const [selectedResource, setSelectedResource] = useState<any>(null);
    const [targetUserId, setTargetUserId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [allocationError, setAllocationError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form states for creating resource
    const [name, setName] = useState('');
    const [type, setType] = useState('equipment');
    const [description, setDescription] = useState('');
    const [attributes, setAttributes] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        try {
            const data = await resourceService.getAll();
            setResources(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const addAttributeRow = () => setAttributes([...attributes, { key: '', value: '' }]);

    const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
        const updated = [...attributes];
        updated[index][field] = value;
        setAttributes(updated);
    };

    const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            await resourceService.create({
                name,
                type,
                description: description || null,
                attributes: attributes.filter(a => a.key && a.value)
            });

            setName('');
            setDescription('');
            setType('equipment');
            setAttributes([{ key: '', value: '' }]);
            await loadResources();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create resource. Please try again.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const openAllocationModal = (res: any) => {
        setSelectedResource(res);
        setIsModalOpen(true);
    }

    const closeAllocationModal = () => {
        setIsModalOpen(false);
        setSelectedResource(null);
        setTargetUserId('');
        setDueDate('');
        setAllocationError('');
    }

    // New: allocation handler
    const handleAllocate = async () => {
        if (!selectedResource) return;
        setAllocationError('');
        setIsAllocating(true);

        // targetUserId can be numeric id or email
        const payload: any = {};
        if (targetUserId) {
            // if it's numeric, pass as id; else pass as email string (backend resolves)
            payload.userId = isNaN(Number(targetUserId)) ? targetUserId.trim() : Number(targetUserId);
        }

        if (dueDate) payload.dueDate = dueDate;

        try {
            await resourceService.allocate(selectedResource.id, payload);
            // refresh resources
            await loadResources();
            // close modal
            closeAllocationModal();
            // alert('Resource allocated successfully'); // Replaced with inline success ideally, but for now just clear
        } catch (err: any) {
            console.error(err);
            setAllocationError(err?.response?.data?.message || 'Failed to allocate resource');
        } finally {
            setIsAllocating(false);
        }
    };

    const formatAttrValue = (a: any) => {
        if (!a) return '—';
        if (a.stringValue) return a.stringValue;
        if (a.numberValue !== undefined && a.numberValue !== null) return a.numberValue.toString();
        if (a.dateValue) return new Date(a.dateValue).toLocaleDateString();
        if (a.booleanValue !== undefined && a.booleanValue !== null) return a.booleanValue ? 'Yes' : 'No';
        return '—';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">

                <Button
                    variant="ghost"
                    className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => navigate('/admin/home')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Resource Allocation</h1>
                        <p className="text-muted-foreground">Manage and allocate equipment and software licenses</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Create New Resource Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Plus className="w-5 h-5" /> Create New Resource
                        </CardTitle>
                        <CardDescription>Add new equipment or licenses to the inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Resource Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Laptop Model X"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={type}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="equipment">Equipment</SelectItem>
                                            <SelectItem value="software_license">Software License</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Extra Details</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addAttributeRow} className="gap-1">
                                        <Plus className="w-3 h-3" /> Add Information
                                    </Button>
                                </div>

                                {attributes.map((attr, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <Input
                                            placeholder="Detail Name (e.g., Color, Serial #)"
                                            value={attr.key}
                                            onChange={(e) => updateAttribute(idx, 'key', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={attr.value}
                                            onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeAttribute(idx)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    {submitting ? 'Creating...' : 'Create Resource'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Current Resources List */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Available Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Name</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Attributes</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {resources.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center p-8 text-muted-foreground">
                                                No resources found. Create one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        resources.map((res) => (
                                            <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-medium">{res.name}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="capitalize">
                                                        {getResourceTypeLabel(res.type)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {res.attributes?.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {res.attributes.map((a: any, i: number) => (
                                                                <div key={i} className="text-xs">
                                                                    <span className="font-semibold">{a.attribute?.label || a.attribute?.key}:</span> {formatAttrValue(a)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {res.isAvailable ? (
                                                        <div className="flex items-center gap-2 text-green-600 font-medium text-xs">
                                                            <CheckCircle className="w-4 h-4" /> Available
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-red-600 font-medium text-xs">
                                                            <XCircle className="w-4 h-4" /> Allocated
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        onClick={() => openAllocationModal(res)}
                                                        disabled={!res.isAvailable}
                                                        size="sm"
                                                        variant={res.isAvailable ? "default" : "secondary"}
                                                    >
                                                        {res.isAvailable ? 'Allocate' : 'Allocated'}
                                                    </Button>
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

            {/* Allocation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Allocate Resource</DialogTitle>
                        <DialogDescription>
                            Assign <strong>{selectedResource?.name}</strong> to a user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {allocationError && (
                            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                                {allocationError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="targetUser">Allocate to (User ID or Email) *</Label>
                            <Input
                                id="targetUser"
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                placeholder="Enter user ID or email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date (Optional)</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={closeAllocationModal} disabled={isAllocating}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleAllocate} disabled={isAllocating || !targetUserId.trim()}>
                            {isAllocating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Allocating...
                                </>
                            ) : (
                                'Confirm Allocation'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
