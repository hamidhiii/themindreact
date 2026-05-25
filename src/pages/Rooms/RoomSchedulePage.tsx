import { CalendarDays, Clock, DoorOpen } from 'lucide-react';
import { useGetRoomScheduleQuery } from '../../store/api/mainTheMindApi';

const fallbackRooms = [
  { roomName: 'Black', colorHex: '#1A2233', groups: [] },
  { roomName: 'Blue', colorHex: '#6B7FD4', groups: [] },
  { roomName: 'Green', colorHex: '#2ECC8A', groups: [] },
  { roomName: 'Orange', colorHex: '#ED6A2E', groups: [] },
];

function colorFor(hex: string | undefined, index: number) {
  const palette = ['#1A2233', '#6B7FD4', '#2ECC8A', '#ED6A2E', '#E74C3C'];
  return hex || palette[index % palette.length];
}

export default function RoomSchedulePage() {
  const { data, isLoading, isError } = useGetRoomScheduleQuery();
  const rooms = data?.rooms?.length ? data.rooms : fallbackRooms;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#1A2233]">
            Room Schedule
          </h1>
          <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
            Full classroom timetable, grouped by room.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#ED6A2E]/10 px-3 py-2 text-[12px] font-black text-[#ED6A2E]">
          <CalendarDays size={16} />
          Today
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#F0F1F5] bg-white shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <div className="flex flex-wrap gap-2 border-b border-[#F0F1F5] p-5">
          {rooms.map((room, index) => {
            const color = colorFor(room.colorHex, index);
            return (
              <div
                key={`${room.roomName}-${index}`}
                className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase"
                style={{ color, backgroundColor: `${color}0D`, borderColor: `${color}33` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {room.roomName || `Room ${index + 1}`}
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex h-[360px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
          </div>
        ) : isError ? (
          <div className="flex h-[260px] items-center justify-center px-6 text-center text-[13px] font-semibold text-[#8A9BB8]">
            Could not load the room schedule. The layout is ready and will fill when the API responds.
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-2 xl:grid-cols-4">
            {rooms.map((room, index) => {
              const color = colorFor(room.colorHex, index);
              const groups = room.groups ?? [];
              return (
                <section key={`${room.roomName}-${index}-column`} className="min-h-[360px] border-b border-[#F0F1F5] p-5 last:border-b-0 lg:border-r lg:last:border-r-0 xl:border-b-0">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}14` }}>
                      <DoorOpen size={19} />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-black text-[#1A2233]">
                        {room.roomName || `Room ${index + 1}`}
                      </h2>
                      <p className="text-[11px] font-bold text-[#8A9BB8]">
                        {groups.length} groups
                      </p>
                    </div>
                  </div>

                  {groups.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[#E7EAF1] bg-[#F8F9FB] px-4 py-8 text-center text-[12px] font-bold text-[#8A9BB8]">
                      No lessons scheduled
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groups.map((group, groupIndex) => (
                        <div
                          key={`${group.groupName}-${groupIndex}`}
                          className="rounded-[16px] border p-4 shadow-[0_2px_10px_rgba(26,34,51,0.04)]"
                          style={{ borderColor: `${color}2E`, backgroundColor: `${color}08` }}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-black text-[#1A2233]">
                                {group.groupName || 'Group'}
                              </p>
                              <p className="mt-1 truncate text-[12px] font-semibold text-[#8A9BB8]">
                                {group.teacher || 'Teacher'}
                              </p>
                            </div>
                            <span className="rounded-lg px-2 py-1 text-[10px] font-black" style={{ color, backgroundColor: `${color}18` }}>
                              #{groupIndex + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-bold text-[#1A2233]">
                            <Clock size={15} style={{ color }} />
                            {group.startTime || '--:--'} - {group.endTime || '--:--'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
