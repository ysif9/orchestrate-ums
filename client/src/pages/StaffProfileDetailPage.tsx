import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService } from '@/services/authService';

interface Department {
  id: number;
  name: string;
}

interface OfficeHourSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
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
  officeHours?: OfficeHourSlot[]; // new
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function StaffProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const user: any = authService.getCurrentUser();
  const isStaff = user?.role === 'staff';

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

  // Message Dialog State
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (isStudent && messageOpen) {
      // Fetch student enrollments for context dropdown
      const fetchEnrollments = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const json = await res.json();
          // json is array of enrollments
          if (Array.isArray(json)) {
            setMyCourses(json.map((e: any) => e.course));
          }
        } catch (e) {
          console.error("Failed to fetch enrollments", e);
        }
      };
      fetchEnrollments();
    }
  }, [messageOpen, isStudent]);

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

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !id) return;
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: Number(id),
          content: messageContent,
          courseId: selectedCourseId && selectedCourseId !== 'none' ? Number(selectedCourseId) : undefined
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess('Message sent successfully!');
        setMessageOpen(false);
        setMessageContent('');
        setSelectedCourseId('');
      } else {
        setError(json.message || 'Failed to send message');
      }
    } catch (e: any) {
      setError(e.message || 'Error sending message');
    } finally {
      setSendingMessage(false);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }
  };

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
        <Button
          variant="outline"
          onClick={() =>
            navigate(isStaff ? '/admin/staff-directory' : '/staff-directory')
          }
        >
          Back to directory
        </Button>
      </div>
    );
  }

  const backPath =
    location.pathname.startsWith('/admin')
      ? '/admin/staff-directory'
      : '/staff-directory';

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
        <div className="flex gap-2">
          {isStudent && profile.role === 'professor' && (
            <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
              <DialogTrigger asChild>
                <Button>Private Message</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Private Message</DialogTitle>
                  <DialogDescription>
                    Send a confidential message to {profile.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="course" className="text-sm font-medium">Related Course (Optional)</label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course context..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / General Inquiry</SelectItem>
                        {myCourses.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.code} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendMessage} disabled={sendingMessage || !messageContent.trim()}>
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Back to directory
          </Button>
        </div>
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
                disabled={!isStaff}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isStaff}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Office location</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                disabled={!isStaff}
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

          {isStaff && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
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

      {profile.role === 'professor' && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Office hours</h2>
            {profile.officeHours && profile.officeHours.length > 0 ? (
              <ul className="text-sm space-y-1">
                {profile.officeHours.map((slot) => (
                  <li key={slot.id}>
                    <span className="font-medium">
                      {slot.dayOfWeek.charAt(0).toUpperCase() +
                        slot.dayOfWeek.slice(1)}
                    </span>{' '}
                    {slot.startTime}–{slot.endTime} · {slot.location}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No office hours set.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
