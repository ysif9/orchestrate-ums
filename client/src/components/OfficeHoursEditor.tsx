import { useState } from 'react';

type OfficeHourSlot = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
};

interface OfficeHoursEditorProps {
  slots: OfficeHourSlot[];
  loading?: boolean;
  error?: string;
  onCreate: (input: Omit<OfficeHourSlot, 'id'>) => Promise<void> | void;
  onUpdate: (
    id: number,
    input: Partial<Omit<OfficeHourSlot, 'id'>>
  ) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export default function OfficeHoursEditor({
  slots,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: OfficeHoursEditorProps) {
  // new slot form
  const [day, setDay] = useState('monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleCreate = async () => {
    setLocalError('');
    if (!startTime.trim() || !endTime.trim() || !location.trim()) {
      setLocalError('Start time, end time, and location are required.');
      return;
    }
    try {
      setCreating(true);
      await onCreate({
        dayOfWeek: day,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
      });
      setStartTime('');
      setEndTime('');
      setLocation('');
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to add office hour slot.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLocalError('');
    try {
      await onDelete(id);
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to delete office hour slot.');
    }
  };

  const handleInlineChange = async (
    id: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime' | 'location',
    value: string,
  ) => {
    setLocalError('');
    try {
      await onUpdate(id, { [field]: value });
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to update office hour slot.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Office hours</h2>
        <p className="text-sm text-muted-foreground">
          Manage your weekly office hour slots.
        </p>
      </div>

      {(error || localError) && (
        <p className="text-sm text-destructive">
          {error || localError}
        </p>
      )}

      {/* existing slots */}
      <div className="rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Day
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Start
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                End
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Location
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-sm text-muted-foreground"
                >
                  Loading office hours...
                </td>
              </tr>
            ) : slots.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-sm text-muted-foreground"
                >
                  No office hours set yet.
                </td>
              </tr>
            ) : (
              slots.map((slot) => (
                <tr key={slot.id} className="border-t border-border/70">
                  <td className="px-4 py-2">
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={slot.dayOfWeek}
                      onChange={(e) =>
                        handleInlineChange(
                          slot.id,
                          'dayOfWeek',
                          e.target.value,
                        )
                      }
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="time"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleInlineChange(
                          slot.id,
                          'startTime',
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="time"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={slot.endTime}
                      onChange={(e) =>
                        handleInlineChange(slot.id, 'endTime', e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={slot.location}
                      onChange={(e) =>
                        handleInlineChange(
                          slot.id,
                          'location',
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="text-sm text-destructive hover:underline"
                      onClick={() => handleDelete(slot.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* add new slot */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add new slot</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Day</label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Start time</label>
            <input
              type="time"
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">End time</label>
            <input
              type="time"
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Location</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office 3B, Zoom link, etc."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Adding...' : 'Add slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
