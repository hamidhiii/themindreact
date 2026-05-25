import { useGetDashboardRoomsQuery } from '../../../store/api/dashboardApi';
import { DoorOpen, Clock } from 'lucide-react';

export default function HomeRoomsSection() {
  const { data: rooms = [], isLoading } = useGetDashboardRoomsQuery();

  return (
    <div className="bg-white rounded-2xl border border-[#F0F1F5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ED6A2E]/15 flex items-center justify-center">
            <DoorOpen size={20} className="text-[#ED6A2E]" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#1A2233]">Rooms</h3>
            <p className="text-[11px] text-[#8A9BB8] font-medium">Today's load</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-[#8A9BB8]">{rooms.length}</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-[#8A9BB8] text-[12px]">Loading...</div>
      ) : rooms.length === 0 ? (
        <div className="py-8 text-center text-[#8A9BB8] text-[12px]">No room data</div>
      ) : (
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
          {rooms.map((r) => (
            <div key={`${r.id}-${r.name}`} className="rounded-xl border border-[#F0F1F5] p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${r.color || '#ED6A2E'}1A` }}
                >
                  <DoorOpen size={16} style={{ color: r.color || '#ED6A2E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-extrabold text-[#1A2233] truncate">{r.name}</p>
                  <p className="text-[10px] text-[#8A9BB8] font-medium inline-flex items-center gap-1">
                    <Clock size={10} /> {r.startTime ?? '-'} - {r.endTime ?? '-'}
                  </p>
                </div>
                {r.groups && r.groups.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F6FA] text-[#5A6B87]">
                    {r.groups.length} groups
                  </span>
                )}
              </div>
              {r.groups && r.groups.length > 0 && (
                <div className="mt-2 ml-12 space-y-1">
                  {r.groups.slice(0, 3).map((g, i) => (
                    <div key={i} className="text-[11px] text-[#5A6B87] truncate">
                      <b className="text-[#1A2233]">{g.groupName}</b> / {g.teacher} / {g.startTime}-{g.endTime}
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
