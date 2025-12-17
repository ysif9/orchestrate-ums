import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '../services/applicationService.js';
import { Search, Filter, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

/**
 * Status badge component for displaying application status
 */
function StatusBadge({ status }: any) {
    const statusConfig: any = {
        pending: { label: 'Pending', variant: 'secondary', icon: Clock },
        under_review: { label: 'Under Review', variant: 'outline', icon: AlertCircle }, // Using outline as closest match for "blue" feeling (custom variants in Badge if needed)
        accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle }, // Default is usually primary/green/brand
        rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
        waitlisted: { label: 'Waitlisted', variant: 'secondary', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    // We can also override classNames if needed to match exact colors
    let className = "gap-1";
    if (status === 'accepted') className += " bg-green-100 text-green-800 hover:bg-green-100";
    if (status === 'under_review') className += " bg-blue-100 text-blue-800 hover:bg-blue-100 border-none";

    return (
        <Badge variant={config.variant} className={className}>
            <IconComponent size={14} />
            {config.label}
        </Badge>
    );
}

/**
 * ApplicationList component displays a list of applications with filtering and sorting
 */
function ApplicationList({ onSelectApplication, showPendingOnly = false }: any) {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('submissionDate');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchApplications();
    }, [showPendingOnly]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError('');
            const response = showPendingOnly
                ? await applicationService.getPendingApplications()
                : await applicationService.getApplications();
            setApplications(response.data || []);
        } catch (err) {
            setError('Failed to load applications. Please try again.');
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort applications
    const filteredApplications = applications
        .filter(app => {
            const matchesSearch = searchTerm === '' ||
                app.applicant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.applicant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.program?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'submissionDate') {
                comparison = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
            } else if (sortBy === 'name') {
                comparison = `${a.applicant?.lastName} ${a.applicant?.firstName}`.localeCompare(
                    `${b.applicant?.lastName} ${b.applicant?.firstName}`
                );
            } else if (sortBy === 'program') {
                comparison = (a.program || '').localeCompare(b.program || '');
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const handleRowClick = (application: any) => {
        if (onSelectApplication) {
            onSelectApplication(application);
        } else {
            navigate(`/admin/applications/${application.id}/review`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Header with filters */}
            <div className="p-6 border-b border-border">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            type="text"
                            placeholder="Search by name, email, or program..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="waitlisted">Waitlisted</option>
                            </select>
                        </div>

                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="submissionDate-desc">Newest First</option>
                            <option value="submissionDate-asc">Oldest First</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                            <option value="program-asc">Program A-Z</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Applications table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Applicant</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Program</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Submitted</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Status</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-foreground"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    No applications found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredApplications.map((application) => (
                                <tr
                                    key={application.id}
                                    onClick={() => handleRowClick(application)}
                                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {application.applicant?.firstName} {application.applicant?.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{application.applicant?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground">{application.program}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(application.submissionDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={application.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ChevronRight size={20} className="text-muted-foreground" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer with count */}
            <div className="px-6 py-4 border-t border-border text-sm text-muted-foreground bg-muted/20">
                Showing {filteredApplications.length} of {applications.length} applications
            </div>
        </Card>
    );
}

export default ApplicationList;
