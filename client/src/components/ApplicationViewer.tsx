import { useState } from 'react';
import { User, GraduationCap, FileText, Paperclip, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"


const ATTACHMENT_TYPE_LABELS: Record<number, string> = {
    1: 'Transcript',
    2: 'Essay',
    3: 'Recommendation',
    4: 'Certificate',
    5: 'ID Document',
    6: 'Photo',
    7: 'Other'
};

function InfoRow({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            {Icon && <Icon size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-foreground">{value || 'Not provided'}</p>
            </div>
        </div>
    );
}

function Section({ title, children }: any) {
    return (
        <div className="mb-6">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">{title}</h4>
            <div className="bg-muted/50 rounded-lg p-4">{children}</div>
        </div>
    );
}

function ApplicationViewer({ application }: any) {
    // We can use Shadcn Tabs state management, usually uncontrolled or controlled.
    // If we want to keep simple state:
    const [activeTab, setActiveTab] = useState('personal');

    if (!application) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                Select an application to view details
            </Card>
        );
    }

    const { applicant } = application;

    const renderPersonalInfo = () => (
        <div>
            <Section title="Contact Information">
                <InfoRow label="Full Name" value={`${applicant?.firstName} ${applicant?.lastName}`} icon={User} />
                <InfoRow label="Email Address" value={applicant?.email} icon={Mail} />
                <InfoRow label="Phone Number" value={applicant?.phone} icon={Phone} />
                <InfoRow label="Address" value={applicant?.address} icon={MapPin} />
            </Section>

            <Section title="Application Details">
                <InfoRow label="Program" value={typeof application.program === 'object' ? application.program.name : application.program} icon={GraduationCap} />
                <InfoRow label="Semester" value={application.semester} icon={Calendar} />
                <InfoRow
                    label="Submission Date"
                    value={new Date(application.submissionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                    icon={Calendar}
                />
            </Section>

            {applicant?.personalInfo && Object.keys(applicant.personalInfo).length > 0 && (
                <Section title="Additional Information">
                    {Object.entries(applicant.personalInfo).map(([key, value]) => (
                        <InfoRow key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={String(value)} />
                    ))}
                </Section>
            )}
        </div>
    );

    const renderAcademicHistory = () => (
        <div>
            {applicant?.academicHistory && Object.keys(applicant.academicHistory).length > 0 ? (
                <>
                    {applicant.academicHistory.previousEducation && (
                        <Section title="Previous Education">
                            {Array.isArray(applicant.academicHistory.previousEducation) ? (
                                applicant.academicHistory.previousEducation.map((edu: any, index: number) => (
                                    <div key={index} className="mb-4 last:mb-0 pb-4 border-b border-border last:border-0">
                                        <p className="font-medium text-foreground">{edu.institution || 'Institution'}</p>
                                        <p className="text-sm text-muted-foreground">{edu.degree || edu.program}</p>
                                        <p className="text-sm text-muted-foreground">{edu.year || edu.graduationYear}</p>
                                        {edu.gpa && <p className="text-sm text-muted-foreground">GPA: {edu.gpa}</p>}
                                    </div>
                                ))
                            ) : (
                                <InfoRow label="Details" value={JSON.stringify(applicant.academicHistory.previousEducation)} />
                            )}
                        </Section>
                    )}

                    {applicant.academicHistory.gpa && (
                        <Section title="Academic Performance">
                            <InfoRow label="GPA" value={applicant.academicHistory.gpa} />
                            {applicant.academicHistory.rank && <InfoRow label="Class Rank" value={applicant.academicHistory.rank} />}
                        </Section>
                    )}

                    {/* Render any other academic history fields */}
                    {Object.entries(applicant.academicHistory)
                        .filter(([key]) => !['previousEducation', 'gpa', 'rank'].includes(key))
                        .map(([key, value]) => (
                            <Section key={key} title={key.replace(/([A-Z])/g, ' $1').trim()}>
                                <InfoRow label={key} value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)} />
                            </Section>
                        ))}
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No academic history information provided
                </div>
            )}
        </div>
    );

    const renderDocuments = () => (
        <div>
            {applicant?.documents && Object.keys(applicant.documents).length > 0 ? (
                Object.entries(applicant.documents).map(([key, value]) => (
                    <Section key={key} title={key.replace(/([A-Z])/g, ' $1').trim()}>
                        {typeof value === 'string' ? (
                            <div className="whitespace-pre-wrap text-sm text-foreground">{value}</div>
                        ) : (
                            <InfoRow label={key} value={JSON.stringify(value, null, 2)} />
                        )}
                    </Section>
                ))
            ) : (
                <div className="text-center py-8 text-muted-foreground">No documents information provided</div>
            )}
        </div>
    );

    const renderAttachments = () => (
        <div>
            {applicant?.attachments && applicant.attachments.length > 0 ? (
                <div className="space-y-3">
                    {applicant.attachments.map((attachment: any) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Paperclip size={20} className="text-primary" />
                            <div className="flex-1">
                                <p className="font-medium text-foreground">{attachment.originalName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {ATTACHMENT_TYPE_LABELS[attachment.type] || 'Other'} • {attachment.mimeType} • {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <Button variant="link" size="sm" asChild>
                                <a
                                    href={`http://localhost:5000/uploads/applicant-documents/${attachment.filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">No attachments uploaded</div>
            )}
        </div>
    );

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-6">
                <h2 className="text-xl font-bold mb-1">
                    {applicant?.firstName} {applicant?.lastName}
                </h2>
                <p className="text-primary-foreground/80">{typeof application.program === 'object' ? application.program.name : application.program} • {application.semester || 'No semester specified'}</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-border px-6 mt-4">
                    <TabsList className="bg-transparent h-auto p-0 space-x-6">
                        <TabsTrigger
                            value="personal"
                            className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                        >
                            <User size={16} className="mr-2" />
                            Personal Info
                        </TabsTrigger>
                        <TabsTrigger
                            value="academic"
                            className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                        >
                            <GraduationCap size={16} className="mr-2" />
                            Academic History
                        </TabsTrigger>
                        <TabsTrigger
                            value="documents"
                            className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                        >
                            <FileText size={16} className="mr-2" />
                            Documents
                        </TabsTrigger>
                        <TabsTrigger
                            value="attachments"
                            className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                        >
                            <Paperclip size={16} className="mr-2" />
                            Attachments
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Tab content */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                    <TabsContent value="personal" className="mt-0">{renderPersonalInfo()}</TabsContent>
                    <TabsContent value="academic" className="mt-0">{renderAcademicHistory()}</TabsContent>
                    <TabsContent value="documents" className="mt-0">{renderDocuments()}</TabsContent>
                    <TabsContent value="attachments" className="mt-0">{renderAttachments()}</TabsContent>
                </div>
            </Tabs>
        </Card>
    );
}

export default ApplicationViewer;
