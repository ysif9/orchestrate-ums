import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Department {
  id: number;
  name: string;
}

interface StaffProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  officeLocation?: string;
  department?: Department | null;
  assignedCourses: any[];
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function StaffProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // editable fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_BASE_URL}/staff-directory/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load staff profile');
        }

        if (!cancelled) {
          const data: StaffProfile = json.data;
          setProfile(data);
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setOfficeLocation(data.officeLocation || '');
          setDepartmentName(data.department?.name || '');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Error loading staff profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/staff-directory/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          officeLocation: officeLocation || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update staff profile');
      }

      setProfile(json.data);
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Error updating staff profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6 text-sm text-muted-foreground">
        Loading staff profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-6 py-6">
        <p className="mb-4 text-sm text-destructive">
          {error || 'Staff member not found.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/staff-directory')}>
          Back to directory
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.role.replace('_', ' ')}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/staff-directory')}>
          Back to directory
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contact information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Office location</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={departmentName}
                readOnly
                placeholder="No department assigned"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-2">Assigned courses</h2>
          {profile.assignedCourses?.length > 0 ? (
            <ul className="list-disc list-inside text-sm">
              {profile.assignedCourses.map((c: any, idx: number) => (
                <li key={idx}>{c.name || c.code || 'Course'}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No courses assigned.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
