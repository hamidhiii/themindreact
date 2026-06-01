import { useState } from 'react';
import { DoorOpen, Plus, Pencil, Trash2, X, Clock, AlertTriangle } from 'lucide-react';
import {
  useGetSettingsRoomsQuery,
  useCreateSettingsRoomMutation,
  useUpdateSettingsRoomMutation,
  useDeleteSettingsRoomMutation,
} from '../../store/api/settingsApi';
import type { RoomSettingModel } from '../../types';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../../components/common/modalStyles';
import { useToast } from '../../hooks/useToast';

const PRESET_COLORS = ['#ED6A2E', '#4C6FFF', '#2ECC81', '#9B59B6', '#F39C12', '#E74C3C', '#1ABC9C', '#3498DB'];

export default function RoomsPage() {
  const { data: rooms = [], isLoading } = useGetSettingsRoomsQuery();
  const [editing, setEditing] = useState<RoomSettingModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RoomSettingModel | null>(null);
  const [deleteRoom] = useDeleteSettingsRoomMutation();
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#F0F1F5] p-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFE5D6] flex items-center justify-center">
            <DoorOpen size={22} className="text-[#ED6A2E]" />
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold text-[#1A2233] tracking-tight">Rooms</h1>
            <p className="text-[12px] text-[#8A9BB8] font-medium mt-0.5">Manage center classrooms</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl bg-[#ED6A2E] text-white text-[13px] font-bold inline-flex items-center gap-2 hover:bg-[#d85d27]"
        >
          <Plus size={16} /> Add room
        </button>
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-8 text-center text-[#8A9BB8]">Loading...</div>
      )}

      {!isLoading && rooms.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-10 text-center">
          <DoorOpen size={32} className="mx-auto text-[#D8DCE5] mb-3" />
          <p className="text-[14px] font-bold text-[#1A2233]">No rooms</p>
          <p className="text-[12px] text-[#8A9BB8] mt-1">Add the first room.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#F0F1F5] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${r.color || '#ED6A2E'}1A` }}
                >
                  <DoorOpen size={20} style={{ color: r.color || '#ED6A2E' }} />
                </div>
                <div>
                  <p className="text-[15px] font-extrabold text-[#1A2233]">{r.name}</p>
                  <p className="text-[11px] text-[#8A9BB8] font-medium mt-0.5 inline-flex items-center gap-1">
                    <Clock size={11} /> {r.startTime || '-'} - {r.endTime || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditing(r); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-gray-50 text-[#5A6B87]"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setConfirmDelete(r)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[#E74C3C]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <RoomFormDialog
          room={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {confirmDelete && (
        <div className={MODAL_OVERLAY_CLASS}>
          <div className={`rounded-2xl w-full max-w-sm p-6 ${MODAL_PANEL_CLASS}`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-[#E74C3C]" />
              <h2 className="text-[16px] font-extrabold text-[#1A2233]">Confirm delete</h2>
            </div>
            <p className="text-[13px] text-[#5A6B87] mb-5">
              Delete room <b>{confirmDelete.name}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteRoom(confirmDelete.id).unwrap();
                  toast.success('Room deleted successfully');
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#E74C3C] text-white text-[13px] font-bold hover:bg-[#c0392b]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomFormDialog({ room, onClose }: { room: RoomSettingModel | null; onClose: () => void }) {
  const [name, setName] = useState(room?.name ?? '');
  const [color, setColor] = useState(room?.color || PRESET_COLORS[0]);
  const [startTime, setStartTime] = useState(room?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(room?.endTime ?? '21:00');
  const [createRoom, { isLoading: c1 }] = useCreateSettingsRoomMutation();
  const [updateRoom, { isLoading: c2 }] = useUpdateSettingsRoomMutation();
  const toast = useToast();

  const submitting = c1 || c2;

  const save = async () => {
    if (!name.trim()) return;
    if (room) {
      await updateRoom({ id: room.id, name: name.trim(), color, startTime, endTime }).unwrap();
      toast.success('Room updated successfully');
    } else {
      await createRoom({ name: name.trim(), color, startTime, endTime }).unwrap();
      toast.success('Room created successfully');
    }
    onClose();
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={`rounded-2xl w-full max-w-md p-6 ${MODAL_PANEL_CLASS}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#1A2233]">
            {room ? 'Edit room' : 'New room'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
              placeholder="Example: A-101"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-2 block uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-[#1A2233]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={submitting || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#ED6A2E] text-white text-[13px] font-bold disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
