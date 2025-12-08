// client/src/pages/AllocateResources.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceService } from '../services/resourceService.js';
import { Plus, Save, Package, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AllocateResources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allocationError, setAllocationError] = useState('');

  // Form states for creating resource
  const [name, setName] = useState('');
  const [type, setType] = useState('equipment');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([{ key: '', value: '' }]);
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

  const updateAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
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
    } catch (err) {
      console.error(err);
      setError('Failed to create resource. Make sure attributes exist in DB.');
    } finally {
      setSubmitting(false);
    }
  };

  // New: allocation handler
  const handleAllocate = async () => {
    if (!selectedResource) return;
    setAllocationError('');
    setIsAllocating(true);

    // targetUserId can be numeric id or email
    const payload = {};
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
      setSelectedResource(null);
      setTargetUserId('');
      setDueDate('');
      alert('Resource allocated successfully');
    } catch (err) {
      console.error(err);
      setAllocationError(err?.response?.data?.message || 'Failed to allocate resource');
    } finally {
      setIsAllocating(false);
    }
  };

  const formatAttrValue = (a) => {
    if (!a) return '—';
    if (a.stringValue) return a.stringValue;
    if (a.numberValue !== undefined && a.numberValue !== null) return a.numberValue.toString();
    if (a.dateValue) return new Date(a.dateValue).toLocaleDateString();
    if (a.booleanValue !== undefined && a.booleanValue !== null) return a.booleanValue ? 'Yes' : 'No';
    return '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-brand-500" />
        <h1 className="text-3xl font-bold text-content">Resource Allocation</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Create New Resource Form */}
      <div className="bg-white border border-border rounded-xl shadow-card p-8 mb-8">
        <h2 className="text-xl font-semibold text-content mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Create New Resource
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Resource Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g., Laptop Model X"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="equipment">Equipment</option>
                <option value="software_license">Software License</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e => setDescription(e.target.value))}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-content">Attributes (EAV)</label>
              <button type="button" onClick={addAttributeRow} className="text-brand-600 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Attribute
              </button>
            </div>

            {attributes.map((attr, idx) => (
              <div key={idx} className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Key (e.g., serial_number)"
                  value={attr.key}
                  onChange={(e) => updateAttribute(idx, 'key', e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(idx)}
                  className="px-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {submitting ? 'Creating...' : 'Create Resource'}
          </button>
        </form>
      </div>

      {/* Current Resources List */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-content">Available Resources</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface text-xs uppercase text-content-secondary">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Attributes</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-surface">
                  <td className="px-6 py-4 font-medium">{res.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs">
                      {res.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {res.attributes?.length > 0 ? (
                      res.attributes.map((a, i) => (
                        <div key={i}>
                          <strong>{a.attribute?.label || a.attribute?.key}:</strong> {formatAttrValue(a)}
                        </div>
                      ))
                    ) : (
                      <span className="text-content-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {res.isAvailable ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" /> Allocated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedResource(res)}
                      disabled={!res.isAvailable}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm
                        ${res.isAvailable ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                      `}
                    >
                      {res.isAvailable ? 'Allocate' : 'Allocated'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedResource && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-content">Allocate {selectedResource.name}</h3>
                  <button
                    onClick={() => {
                      setSelectedResource(null);
                      setTargetUserId('');
                      setDueDate('');
                      setAllocationError('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {allocationError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{allocationError}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-content mb-2">Allocate to (User ID or Email)</label>
                    <input
                      type="text"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg"
                      placeholder="Enter user ID or email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-content mb-2">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => {
                      setSelectedResource(null);
                      setTargetUserId('');
                      setDueDate('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-border text-content rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAllocate}
                    disabled={isAllocating || !targetUserId.trim()}
                    className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAllocating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Allocating...
                      </>
                    ) : (
                      'Confirm Allocation'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
