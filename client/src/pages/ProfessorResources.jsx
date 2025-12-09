// client/src/pages/ProfessorResources.jsx
import { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService.js';
import { Package, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function ProfessorResources() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await resourceService.getMyAllocations();
        setAllocations(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load your resources');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-brand-500" /></div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-brand-500" />
        <h1 className="text-3xl font-bold text-content">My Allocated Resources</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {allocations.length === 0 ? (
        <div className="text-center py-20 text-content-secondary">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No resources allocated to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {allocations.map((alloc) => (
            <div key={alloc.id} className="bg-white border border-border rounded-xl shadow-card p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-content">{alloc.resource?.name}</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Active
                </span>
              </div>
              <p className="text-content-secondary mb-4">{alloc.resource?.description || 'No description'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Type:</strong> {alloc.resource?.type?.replace('_', ' ') || '—'}
                </div>
                <div>
                  <strong>Allocated:</strong> {formatDate(alloc.allocatedAt)}
                </div>
                {alloc.dueDate && (
                  <div>
                    <strong>Due:</strong> {formatDate(alloc.dueDate)}
                  </div>
                )}
              </div>
              {alloc.resource?.attributes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <strong className="text-sm text-content-secondary">Details:</strong>
                  {alloc.resource.attributes.map((a, i) => (
                    <div key={i} className="text-sm mt-1">
                      • {a.attribute?.label}: <span className="font-medium">
                        {a.stringValue ?? (a.numberValue !== undefined ? a.numberValue : (a.dateValue ? new Date(a.dateValue).toLocaleDateString() : (a.booleanValue !== undefined ? (a.booleanValue ? 'Yes' : 'No') : '—')))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
