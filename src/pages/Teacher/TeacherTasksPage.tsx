import { CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react';
import { useGetTasksQuery } from '../../store/api/taskApi';

export default function TeacherTasksPage() {
  const { data: tasks = [], isLoading } = useGetTasksQuery();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[24px] font-extrabold text-[#1A2233]">Tasks</h1>
        <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
          Assigned tasks and current progress.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-[18px] border border-[#F0F1F5] bg-white py-12 text-center text-[#8A9BB8] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No tasks yet</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-[18px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-black text-[#1A2233]">
                    {task.title || 'Task'}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[12px] font-semibold text-[#8A9BB8]">
                    {task.description || 'No description'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${task.isCompleted ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]' : 'bg-[#ED6A2E]/10 text-[#ED6A2E]'}`}>
                  {task.statusDisplay || task.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-[12px] font-bold text-[#8A9BB8]">
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  {task.deadline || 'No deadline'}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  {task.priorityDisplay || task.priority || 'Normal'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
