import { useState, useEffect } from 'react';
import { applicationService } from '../services/applicationService.js';
import { X, Download, FileText, Clock, User, Loader2 } from 'lucide-react';

/**
 * DecisionLetterModal - Modal component for viewing and downloading decision letters
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {number} props.applicationId - Application ID to fetch letters for
 * @param {Object} props.generatedLetter - Optional newly generated letter to display
 */
function DecisionLetterModal({ isOpen, onClose, applicationId, generatedLetter }) {
    const [letters, setLetters] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState(null);
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

    const handleDownload = async (letter) => {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Decision Letters</h2>
                            <p className="text-sm text-gray-500">View and download generated letters</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Letter list sidebar */}
                    <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
                        <div className="p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Generated Letters ({letters.length})
                            </h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="text-indigo-500 animate-spin" />
                                </div>
                            ) : letters.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4">No letters generated yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {letters.map((letter) => (
                                        <button
                                            key={letter.id}
                                            onClick={() => setSelectedLetter(letter)}
                                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedLetter?.id === letter.id
                                                    ? 'bg-indigo-100 border-indigo-300 border'
                                                    : 'bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                <Clock size={12} />
                                                {formatDate(letter.generatedAt)}
                                            </div>
                                            {letter.generatedBy && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
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
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {selectedLetter ? (
                            <>
                                {/* Letter actions */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Generated on {formatDate(selectedLetter.generatedAt)}
                                    </div>
                                    <button
                                        onClick={() => handleDownload(selectedLetter)}
                                        disabled={downloading}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        {downloading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                Download Letter
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Letter preview */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
                                        <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                                            {selectedLetter.content}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>Select a letter to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DecisionLetterModal;
