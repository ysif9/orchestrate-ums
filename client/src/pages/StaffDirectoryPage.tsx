import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffDirectoryService } from '../services/staffDirectoryService.js';
import { authService } from '@/services/authService';

interface StaffRow {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  officeLocation?: string;
  department?: { id: number; name: string } | null;
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // New staff form state
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'professor' | 'teaching_assistant'>(
    'professor',
  );
  const [newPhone, setNewPhone] = useState('');
  const [newOfficeLocation, setNewOfficeLocation] = useState('');

  // role detection
  const user: any = authService.getCurrentUser();
  const isStaff = user?.role === 'staff';

  useEffect(() => {
    let cancelled = false;

    const fetchStaff = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await staffDirectoryService.getAll(search);
        if (!cancelled) setStaff(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Failed to load staff directory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStaff();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleCreate = async () => {
    setCreateError('');
    setCreateSaving(true);

    try {
      if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
        throw new Error('Name, email, and password are required.');
      }

      await staffDirectoryService.create({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        phone: newPhone.trim() || undefined,
        officeLocation: newOfficeLocation.trim() || undefined,
        // departmentId: undefined, // add when you have department selection
      });

      // refresh list with current search
      const updated = await staffDirectoryService.getAll(search);
      setStaff(updated);

      // reset form + close
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewOfficeLocation('');
      setNewRole('professor');
      setIsCreating(false);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Failed to create staff member');
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Staff directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View professors and teaching assistants
            {isStaff && ' and manage their profiles.'}
            {!isStaff && '.'}
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Add staff member
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const role = user?.role;
            if (role === 'teaching_assistant') navigate('/ta-dashboard');
            else if (role === 'parent') navigate('/parent/home');
            else if (role === 'professor' || role === 'staff') navigate('/admin/home');
            else navigate('/home');
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-muted"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading staff...</p>
      )}

      {error && (
        <p className="mb-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && staff.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No staff found. Try adjusting your search.
        </p>
      )}

      {!loading && staff.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Department
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border/70 hover:bg-muted"
                >
                  <td
                    className="px-4 py-2 cursor-pointer text-primary underline-offset-2 hover:underline"
                    onClick={() =>
                      navigate(
                        isStaff
                          ? `/admin/staff-directory/${u.id}`
                          : `/staff-directory/${u.id}`,
                      )
                    }
                  >
                    {u.name}
                  </td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-2">
                    {u.department ? u.department.name : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isStaff && isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Add staff member</h2>

            {createError && (
              <p className="mb-2 text-sm text-destructive">{createError}</p>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(
                      e.target.value as 'professor' | 'teaching_assistant',
                    )
                  }
                >
                  <option value="professor">Professor</option>
                  <option value="teaching_assistant">Teaching Assistant</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Phone (optional)</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Office location (optional)
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newOfficeLocation}
                  onChange={(e) => setNewOfficeLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                onClick={() => setIsCreating(false)}
                disabled={createSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
                onClick={handleCreate}
                disabled={createSaving}
              >
                {createSaving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
