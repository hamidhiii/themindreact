import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Users,
  WalletCards,
} from 'lucide-react';
import { useGetTeacherDashboardQuery } from '../../store/api/teacherApi';

function amount(value: string | number | undefined) {
  return `${Number(value ?? 0).toLocaleString()} UZS`;
}

export default function TeacherHomePage() {
  const { data: dashboard, isLoading, isError } = useGetTeacherDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[18px] border border-[#F0F1F5] bg-white p-8 text-center text-[13px] font-semibold text-[#8A9BB8]">
        Could not load teacher dashboard. Please try again later.
      </div>
    );
  }

  const groups = dashboard?.groups ?? [];
  const lessons = dashboard?.todayLessons ?? [];
  const missed = dashboard?.history?.filter((item) => item.lessonAmount <= 0).length ?? 0;

  const stats = [
    { label: 'GROUPS', value: groups.length, icon: BookOpen, color: '#6B7FD4' },
    { label: 'STUDENTS', value: dashboard?.studentsCount ?? 0, icon: Users, color: '#2ECC8A' },
    { label: 'THIS MONTH', value: amount(dashboard?.balance), icon: WalletCards, color: '#ED6A2E' },
    { label: 'MISSED', value: missed, icon: CalendarDays, color: '#E74C3C' },
    { label: 'FINES', value: amount(dashboard?.fine), icon: CircleDollarSign, color: '#F39C12' },
    { label: 'LESSONS', value: dashboard?.lessonsThisMonth ?? 0, icon: Clock, color: '#1A2233' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="rounded-[22px] border border-[#E7EAF1] bg-white p-6 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <h1 className="text-[26px] font-black text-[#1A2233]">
          Teacher Dashboard
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-[10px] border border-[#2ECC8A]/20 bg-[#2ECC8A]/10 px-3 py-2 text-[12px] font-bold text-[#2ECC8A]">
            Active
          </span>
          <span className="rounded-[10px] border border-[#ED6A2E]/20 bg-[#ED6A2E]/10 px-3 py-2 text-[12px] font-bold text-[#ED6A2E]">
            Teacher
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[14px] border border-[#E7EAF1] bg-white p-4 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="truncate text-[11px] font-black text-[#8A9BB8]">
                {item.label}
              </p>
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" style={{ color: item.color, backgroundColor: `${item.color}1A` }}>
                <item.icon size={18} />
              </div>
            </div>
            <p className="truncate text-[22px] font-black text-[#1A2233]">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {groups.length > 0 && (
        <section className="rounded-[18px] border border-[#E7EAF1] bg-white p-6 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[17px] font-black text-[#1A2233]">My Groups</h2>
            <p className="text-[13px] font-semibold text-[#8A9BB8]">{groups.length} active</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group, index) => {
              const color = ['#E8623A', '#6B7FD4', '#2ECC8A', '#ED8C6A'][index % 4];
              return (
                <div key={group.id} className="overflow-hidden rounded-[16px] border border-[#E7EAF1] bg-white">
                  <div className="flex h-[86px] items-end p-4" style={{ backgroundColor: `${color}1F` }}>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black tracking-wide" style={{ color }}>
                      GROUP #{group.id}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[15px] font-bold text-[#1A2233]">{group.name}</p>
                    <p className="mt-2 text-[12px] font-semibold text-[#8A9BB8]">
                      {group.studentCount} students
                    </p>
                    <Link
                      to={`groups/${group.id}`}
                      className="mt-4 flex h-10 items-center justify-center rounded-[10px] border border-[#ED6A2E] text-[13px] font-bold text-[#ED6A2E] transition-colors hover:bg-[#ED6A2E]/10"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-[18px] border border-[#E7EAF1] bg-white p-6 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-black text-[#1A2233]">Today's Lessons</h2>
          <p className="text-[13px] font-semibold text-[#8A9BB8]">{lessons.length} scheduled</p>
        </div>
        {lessons.length === 0 ? (
          <div className="py-8 text-center text-[13px] font-semibold text-[#8A9BB8]">
            No lessons scheduled for today
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <div key={lesson.id ?? index} className="rounded-[12px] border border-[#E7EAF1] bg-[#F8F9FB] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-[14px] font-black text-[#1A2233] sm:w-28">
                    {lesson.time || '--:--'}
                  </p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#1A2233]">
                      {lesson.name || 'Lesson'}
                    </p>
                    <p className="truncate text-[12px] font-semibold text-[#8A9BB8]">
                      {lesson.subtitle || lesson.type || 'Group'}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-[#FFF3E0] px-3 py-1 text-[11px] font-bold text-[#FF9800] sm:self-auto">
                    {lesson.status || 'Scheduled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
