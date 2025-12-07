import { useState } from 'react';
import { User, GraduationCap, FileText, Paperclip, Mail, Phone, MapPin, Calendar } from 'lucide-react';

/**
 * Tab button component
 */
function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-content-secondary hover:text-content hover:border-border'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}

/**
 * Info row component for displaying key-value pairs
 */
function InfoRow({ label, value, icon: Icon }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            {Icon && <Icon size={18} className="text-content-secondary mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
                <p className="text-xs text-content-secondary uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-content">{value || 'Not provided'}</p>
            </div>
        </div>
    );
}

/**
 * Section component for grouping related information
 */
function Section({ title, children }) {
    return (
        <div className="mb-6">
            <h4 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">{title}</h4>
            <div className="bg-surface-tertiary rounded-lg p-4">{children}</div>
        </div>
    );
}

/**
 * ApplicationViewer component displays applicant's submitted data in read-only format
 */
function ApplicationViewer({ application }) {
    const [activeTab, setActiveTab] = useState('personal');

    if (!application) {
        return (
            <div className="bg-surface rounded-lg shadow-card p-8 text-center text-content-secondary">
                Select an application to view details
            </div>
        );
    }

    const { applicant } = application;

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'academic', label: 'Academic History', icon: GraduationCap },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'attachments', label: 'Attachments', icon: Paperclip },
    ];

    const renderPersonalInfo = () => (
        <div>
            <Section title="Contact Information">
                <InfoRow label="Full Name" value={`${applicant?.firstName} ${applicant?.lastName}`} icon={User} />
                <InfoRow label="Email Address" value={applicant?.email} icon={Mail} />
                <InfoRow label="Phone Number" value={applicant?.phone} icon={Phone} />
                <InfoRow label="Address" value={applicant?.address} icon={MapPin} />
            </Section>

            <Section title="Application Details">
                <InfoRow label="Program" value={application.program} icon={GraduationCap} />
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
                                applicant.academicHistory.previousEducation.map((edu, index) => (
                                    <div key={index} className="mb-4 last:mb-0 pb-4 border-b border-border last:border-0">
                                        <p className="font-medium text-content">{edu.institution || 'Institution'}</p>
                                        <p className="text-sm text-content-secondary">{edu.degree || edu.program}</p>
                                        <p className="text-sm text-content-secondary">{edu.year || edu.graduationYear}</p>
                                        {edu.gpa && <p className="text-sm text-content-secondary">GPA: {edu.gpa}</p>}
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
                <div className="text-center py-8 text-content-secondary">
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
                            <div className="whitespace-pre-wrap text-sm text-content">{value}</div>
                        ) : (
                            <InfoRow label={key} value={JSON.stringify(value, null, 2)} />
                        )}
                    </Section>
                ))
            ) : (
                <div className="text-center py-8 text-content-secondary">No documents information provided</div>
            )}
        </div>
    );

    const renderAttachments = () => (
        <div>
            {applicant?.attachments && applicant.attachments.length > 0 ? (
                <div className="space-y-3">
                    {applicant.attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-4 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            <Paperclip size={20} className="text-brand-500" />
                            <div className="flex-1">
                                <p className="font-medium text-content">{attachment.originalName}</p>
                                <p className="text-xs text-content-secondary">
                                    {attachment.mimeType} • {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <a
                                href={`http://localhost:5000/uploads/applicant-documents/${attachment.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                            >
                                View
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-content-secondary">No attachments uploaded</div>
            )}
        </div>
    );

    return (
        <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white p-6">
                <h2 className="text-xl font-bold mb-1">
                    {applicant?.firstName} {applicant?.lastName}
                </h2>
                <p className="text-brand-100">{application.program} • {application.semester || 'No semester specified'}</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex overflow-x-auto">
                {tabs.map((tab) => (
                    <TabButton
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        icon={tab.icon}
                        label={tab.label}
                    />
                ))}
            </div>

            {/* Tab content */}
            <div className="p-6 max-h-[600px] overflow-y-auto">
                {activeTab === 'personal' && renderPersonalInfo()}
                {activeTab === 'academic' && renderAcademicHistory()}
                {activeTab === 'documents' && renderDocuments()}
                {activeTab === 'attachments' && renderAttachments()}
            </div>
        </div>
    );
}

export default ApplicationViewer;

