import { useState, useEffect } from 'react';
import { applicationService } from '../services/applicationService.js';
import { Download, FileText, Clock, User, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

/**
 * DecisionLetterModal - Modal component for viewing and downloading decision letters
 */
function DecisionLetterModal({ isOpen, onClose, applicationId, generatedLetter }: any) {
    const [letters, setLetters] = useState<any[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchLetters();
        }
    }, [isOpen, applicationId]);

    useEffect(() => {
        if (generatedLetter) {
            setSelectedLetter(generatedLetter);
        }
    }, [generatedLetter]);

    const fetchLetters = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await applicationService.getDecisionLetters(applicationId);
            setLetters(response.data || []);

            // Select the most recent letter by default if none selected
            if (!selectedLetter && response.data?.length > 0) {
                setSelectedLetter(response.data[0]);
            }
        } catch (err) {
            setError('Failed to load decision letters.');
            console.error('Error fetching letters:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (letter: any) => {
        if (!letter) return;

        try {
            setDownloading(true);
            await applicationService.downloadDecisionLetter(letter.id);
        } catch (err) {
            setError('Failed to download letter. Please try again.');
            console.error('Error downloading letter:', err);
        } finally {
            setDownloading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-primary" />
                        </div>
                        <div>
                            Decision Letters
                            <DialogDescription>View and download generated letters</DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Letter list sidebar */}
                    <div className="w-64 border-r border-border overflow-y-auto bg-muted/20">
                        <div className="p-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Generated Letters ({letters.length})
                            </h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="text-primary animate-spin" />
                                </div>
                            ) : letters.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No letters generated yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {letters.map((letter) => (
                                        <button
                                            key={letter.id}
                                            onClick={() => setSelectedLetter(letter)}
                                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedLetter?.id === letter.id
                                                ? 'bg-primary/10 border-primary/20 border'
                                                : 'bg-background border border-border hover:border-primary/20 hover:bg-primary/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <Clock size={12} />
                                                {formatDate(letter.generatedAt)}
                                            </div>
                                            {letter.generatedBy && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                                    <User size={12} />
                                                    {letter.generatedBy.name || 'Staff'}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Letter content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-background">
                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {selectedLetter ? (
                            <>
                                {/* Letter actions */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
                                    <div className="text-sm text-muted-foreground">
                                        Generated on {formatDate(selectedLetter.generatedAt)}
                                    </div>
                                    <Button
                                        onClick={() => handleDownload(selectedLetter)}
                                        disabled={downloading}
                                        size="sm"
                                    >
                                        {downloading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin mr-2" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} className="mr-2" />
                                                Download Letter
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Letter preview */}
                                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                                    <div className="bg-white text-black border border-border rounded-lg shadow-sm p-8 max-w-2xl mx-auto min-h-[500px]">
                                        {/* Using text-black explicitly for the letter content as it resembles a physical paper */}
                                        <pre className="whitespace-pre-wrap font-serif leading-relaxed">
                                            {selectedLetter.content}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Select a letter to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DecisionLetterModal;
