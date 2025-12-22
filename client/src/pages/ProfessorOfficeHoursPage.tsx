import { useEffect, useState } from 'react';
import axios from 'axios';
import { authService } from '@/services/authService';
import OfficeHoursEditor from '@/components/OfficeHoursEditor';

type OfficeHourSlot = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
};

const API_BASE = 'http://localhost:5000/api/office-hours';

export default function ProfessorOfficeHoursPage() {
  const [slots, setSlots] = useState<OfficeHourSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = authService.getToken();

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load office hours.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (input: Omit<OfficeHourSlot, 'id'>) => {
    setError('');
    try {
      await axios.post(
        `${API_BASE}/my`,
        {
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchSlots();
    } catch (err: any) {
      console.error(err);
      throw new Error(
        err.response?.data?.message || 'Failed to create office hour slot.',
      );
    }
  };

  const handleUpdate = async (
    id: number,
    input: Partial<Omit<OfficeHourSlot, 'id'>>,
  ) => {
    setError('');
    try {
      await axios.put(
        `${API_BASE}/my/${id}`,
        input,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchSlots();
    } catch (err: any) {
      console.error(err);
      throw new Error(
        err.response?.data?.message || 'Failed to update office hour slot.',
      );
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
      await axios.delete(`${API_BASE}/my/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSlots();
    } catch (err: any) {
      console.error(err);
      throw new Error(
        err.response?.data?.message || 'Failed to delete office hour slot.',
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          My Office Hours
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set and update the times when students can meet with you.
        </p>
      </div>

      <OfficeHoursEditor
        slots={slots}
        loading={loading}
        error={error}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
