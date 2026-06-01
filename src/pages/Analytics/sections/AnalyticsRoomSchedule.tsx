import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useGetRoomScheduleQuery, useGetRoomsQuery, useCreateRoomMutation } from '../../../store/api/mainTheMindApi';
import ModalShell from '../../../components/common/ModalShell';
import { useToast } from '../../../hooks/useToast';

const ORANGE = '#F37021';

function colorFor(hex: string | undefined, index: number) {
    const palette = ['#2ECC8A', ORANGE, '#4C6FFF', '#1A2233', '#E74C3C'];
    return hex || palette[index % palette.length];
}

function formatDateLabel(date: Date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function buildTimeSlots(startHour = 9, endHour = 22) {
    const slots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00-${String(h).padStart(2, '0')}:30`);
        if (h < endHour) {
            slots.push(`${String(h).padStart(2, '0')}:30-${String(h + 1).padStart(2, '0')}:00`);
        }
    }
    return slots;
}

export default function AnalyticsRoomSchedule() {
    const navigate = useNavigate();
    const [date, setDate] = useState(() => new Date());
    const [showAddRoom, setShowAddRoom] = useState(false);
    const dateIso = toIsoDate(date);
    const isToday = toIsoDate(new Date()) === dateIso;

    const { data: scheduleData, isLoading } = useGetRoomScheduleQuery(dateIso);
    const { data: roomsList = [] } = useGetRoomsQuery();
    const [createRoom, { isLoading: creating }] = useCreateRoomMutation();
    const toast = useToast();

    const rooms = scheduleData?.rooms?.length
        ? scheduleData.rooms
        : roomsList.map((r) => ({
              roomName: r.name,
              colorHex: r.color,
              groups: r.groups ?? [],
          }));

    const lessonCount = useMemo(
        () => rooms.reduce((sum, r) => sum + (r.groups?.length ?? 0), 0),
        [rooms],
    );

    const timeSlots = buildTimeSlots();

    const shiftDate = (days: number) => {
        setDate((d) => {
            const next = new Date(d);
            next.setDate(next.getDate() + days);
            return next;
        });
    };

    return (
        <>
            <div className="overflow-hidden rounded-[18px] border border-[#F0F1F5] bg-white shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                <div className="flex flex-col gap-4 border-b border-[#F0F1F5] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F37021]/10">
                            <CalendarDays size={18} className="text-[#F37021]" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-extrabold text-[#1A2233]">Room Schedule</h3>
                            <p className="text-[11px] font-semibold text-[#8A9BB8]">
                                {rooms.length} rooms · {lessonCount} lessons · {formatDateLabel(date)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-1 py-1">
                            <button
                                type="button"
                                onClick={() => shiftDate(-1)}
                                className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-white hover:text-[#1A2233]"
                                aria-label="Previous day"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDate(new Date())}
                                className={`px-3 py-1 text-[11px] font-bold rounded-lg ${isToday ? 'text-[#F37021]' : 'text-[#5A6376] hover:bg-white'}`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => shiftDate(1)}
                                className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-white hover:text-[#1A2233]"
                                aria-label="Next day"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {rooms.slice(0, 4).map((room, i) => {
                            const color = colorFor(room.colorHex, i);
                            return (
                                <span
                                    key={`${room.roomName}-${i}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                                    style={{ color, borderColor: `${color}33`, backgroundColor: `${color}0D` }}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                                    {room.roomName}
                                </span>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setShowAddRoom(true)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#F37021] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#E5651A]"
                        >
                            <Plus size={14} />
                            Room
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-[320px] items-center justify-center text-[11px] font-semibold text-[#8A9BB8]">
                        Loading schedule...
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex h-[320px] items-center justify-center text-[11px] font-semibold text-[#8A9BB8]">
                        No rooms configured yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div style={{ minWidth: `${80 + rooms.length * 160}px` }}>
                            <div className="flex border-b border-[#F0F1F5] bg-[#F8F9FB]">
                                <div className="w-20 shrink-0 px-2 py-2.5 text-center text-[9px] font-black tracking-widest text-[#8A9BB8]">
                                    TIME
                                </div>
                                {rooms.map((room, i) => {
                                    const color = colorFor(room.colorHex, i);
                                    return (
                                        <div
                                            key={`head-${room.roomName}-${i}`}
                                            className="flex-1 min-w-[160px] px-2 py-2.5 text-center text-[10px] font-black uppercase tracking-wide border-l border-[#F0F1F5]"
                                            style={{ color }}
                                        >
                                            {room.roomName}
                                        </div>
                                    );
                                })}
                            </div>

                            {timeSlots.map((slot) => (
                                <div key={slot} className="flex border-b border-[#F0F1F5] last:border-b-0">
                                    <div className="w-20 shrink-0 px-1 py-2 text-center text-[9px] font-bold text-[#8A9BB8] bg-[#FAFBFC]">
                                        {slot}
                                    </div>
                                    {rooms.map((room, ri) => {
                                        const match = (room.groups ?? []).find((g) => {
                                            const start = (g.startTime ?? '').slice(0, 5);
                                            return slot.startsWith(start);
                                        });
                                        const color = colorFor(room.colorHex, ri);
                                        return (
                                            <div
                                                key={`${slot}-${ri}`}
                                                className="flex-1 min-w-[160px] min-h-[36px] border-l border-[#F0F1F5] p-1"
                                            >
                                                {match && (
                                                    <div
                                                        className="h-full rounded-lg px-2 py-1 text-[9px] font-bold text-white truncate"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {match.groupName}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-[#F0F1F5] p-3 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/room-schedule')}
                        className="text-[11px] font-bold text-[#F37021] hover:underline"
                    >
                        Open full schedule
                    </button>
                </div>
            </div>

            {showAddRoom && (
                <AddRoomDialog
                    loading={creating}
                    onClose={() => setShowAddRoom(false)}
                    onSubmit={async (name) => {
                        await createRoom({ name, color: ORANGE }).unwrap();
                        toast.success('Room created successfully');
                        setShowAddRoom(false);
                    }}
                />
            )}
        </>
    );
}

function AddRoomDialog({
    loading,
    onClose,
    onSubmit,
}: {
    loading: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
}) {
    const [name, setName] = useState('');

    return (
        <ModalShell title="Add Room" onClose={onClose}>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    await onSubmit(name.trim());
                }}
                className="space-y-4"
            >
                <input
                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-semibold outline-none focus:border-[#F37021]/50 focus:bg-white"
                    placeholder="Room name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-[12px] font-bold text-[#8A9BB8]">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="rounded-xl bg-[#F37021] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
