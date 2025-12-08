// client/src/pages/StudentResources.jsx
import { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService.js';
import { Package, Calendar, AlertCircle, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function StudentResources() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [returnError, setReturnError] = useState('');

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

  const handleReturn = async (allocationId) => {
    if (!window.confirm('Are you sure you want to return this resource?')) {
      return;
    }

    setReturningId(allocationId);
    setReturnError('');

    try {
      // Use allocation-based return endpoint
      await resourceService.returnByAllocation(allocationId);

      // remove returned allocation from UI
      setAllocations(prev => prev.filter(a => a.id !== allocationId));
      alert('Resource returned successfully!');
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || 'Failed to return resource. Please contact staff.';
      setReturnError(message);
    } finally {
      setReturningId(null);
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500 mb-4" />
        <p className="text-content-secondary">Loading your resources...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-brand-500" />
        <div>
          <h1 className="text-3xl font-bold text-content">My Allocated Resources</h1>
          <p className="text-content-secondary mt-1">
            View and manage resources assigned to you
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {returnError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {returnError}
        </div>
      )}

      {allocations.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl shadow-card">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-content mb-2">No Resources Allocated</h3>
          <p className="text-content-secondary mb-6 max-w-md mx-auto">
            You don't have any resources allocated to you yet. Resources will appear here once assigned by staff.
          </p>
          <div className="text-sm text-content-tertiary">
            Need equipment or software? Contact your department office.
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-content-secondary">
              Showing <span className="font-semibold">{allocations.length}</span> allocated resource{allocations.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid gap-6">
            {allocations.map((allocation) => {
              const daysRemaining = getDaysRemaining(allocation.dueDate);
              const isOverdue = daysRemaining < 0;
              const dueSoon = daysRemaining >= 0 && daysRemaining <= 7;

              return (
                <div key={allocation.id} className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-content mb-1">
                          {allocation.resource?.name || 'Unknown Resource'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-content-secondary">
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {allocation.resource?.type?.replace('_', ' ') || 'Equipment'}
                          </span>
                          {allocation.allocatedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Allocated: {formatDate(allocation.allocatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${allocation.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          <CheckCircle className="w-4 h-4" />
                          {allocation.status?.charAt(0).toUpperCase() + allocation.status?.slice(1)}
                        </span>
                        {allocation.dueDate && (
                          <span className={`text-sm mt-2 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600' : 'text-green-600'}`}>
                            <Clock className="w-4 h-4" />
                            {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}` : dueSoon ? `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : `Due: ${formatDate(allocation.dueDate)}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {allocation.resource?.description && (
                      <p className="text-content-secondary mb-4">
                        {allocation.resource.description}
                      </p>
                    )}

                    {allocation.resource?.attributes?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-content-secondary mb-3">Resource Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {allocation.resource.attributes.map((attr, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-content-tertiary mb-1">
                                {attr.attribute?.label || 'Detail'}
                              </div>
                              <div className="font-medium">
                                {attr.stringValue || (attr.numberValue !== undefined ? attr.numberValue.toString() : '') || (attr.dateValue ? formatDate(attr.dateValue) : '') || (attr.booleanValue !== undefined ? (attr.booleanValue ? 'Yes' : 'No') : 'N/A')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {allocation.notes && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">Allocation Notes</div>
                        <div className="text-blue-600">{allocation.notes}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div className="text-sm text-content-secondary">
                        Allocation ID: #{allocation.id}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            alert(`Resource details for ${allocation.resource?.name}`);
                          }}
                          className="px-4 py-2 text-brand-600 hover:bg-brand-50 rounded-lg font-medium"
                        >
                          View Details
                        </button>
                        
                        {allocation.status === 'active' && (
                          <button
                            onClick={() => handleReturn(allocation.id)}
                            disabled={returningId === allocation.id}
                            className="px-4 py-2 bg-gray-100 text-content hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
                          >
                            {returningId === allocation.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                Returning...
                              </>
                            ) : (
                              'Return Resource'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Information Footer */}
          <div className="mt-10 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Resource Usage Guidelines
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Return resources promptly when no longer needed or by the due date</li>
              <li>• Report any issues or damages immediately to the facilities office</li>
              <li>• Software licenses are for academic use only</li>
              <li>• Equipment must be used in designated areas only</li>
              <li>• Contact IT support for software installation issues</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
