import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import Sidebar, { SidebarToggle } from '../components/Sidebar/Sidebar';
import type { RootState } from '../store/store';

const titles: Array<[string, string]> = [
  ['/workers/details', 'Employee Profile'],
  ['/students/details', 'Student Details'],
  ['/student-details', 'Student Details'],
  ['/teachers/details', 'Teacher profile'],
  ['/groups/details', 'Group Details'],
  ['/group-details', 'Group Details'],
  ['/task-manager', 'Task Manager'],
  ['/sms-active-users', 'SMS Active Users'],
  ['/sms-new-users', 'SMS New Users'],
  ['/send-task', 'Send Task'],
  ['/branch-manager', 'Branch Manager'],
  ['/notifications', 'Notifications'],
  ['/create-role', 'Create Role'],
  ['/assign-role', 'Assign Role'],
  ['/expense-options', 'Expenses'],
  ['/marketing-analytics', 'Marketing'],
  ['/marketing-leads', 'Marketing Leads'],
  ['/user-access', 'User Access'],
  ['/active-leads', 'Leads'],
  ['/faol-lidlar', 'Leads'],
  ['/students', 'Students Directory'],
  ['/groups', 'Groups'],
  ['/exams', 'Exams'],
  ['/teachers', 'Teachers'],
  ['/tasks', 'Tasks'],
  ['/workers', 'Workers'],
  ['/salary', 'Salary'],
  ['/tariff', 'Tariffs'],
  ['/transactions', 'Transactions'],
  ['/penalties', 'Penalties'],
  ['/settings', 'Settings'],
  ['/news', 'News'],
  ['/feedback', 'Feedback'],
  ['/the-mind', 'Overview'],
  ['/room-schedule', 'Room Schedule'],
  ['/analytics-debtors-detail', 'Analytics'],
  ['/home', 'Dashboard Overview'],
];

function pageTitle(pathname: string) {
  const sorted = [...titles].sort((a, b) => b[0].length - a[0].length);
  return sorted.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'The Mind';
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, username } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const title = useMemo(() => pageTitle(location.pathname), [location.pathname]);
  const initial = (username?.[0] ?? role?.[0] ?? 'A').toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-20 min-[1100px]:ml-[260px]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 bg-bg-app px-3 lg:hidden">
          <SidebarToggle onClick={() => setSidebarOpen(true)} />
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-extrabold text-[#1A2233]">
            {title}
          </h1>
          <button
            type="button"
            className="relative rounded-xl p-2 transition-colors hover:bg-white"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <Bell size={19} className="text-[#8A9BB8]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ED6A2E] ring-2 ring-bg-app" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] text-sm font-extrabold uppercase text-white shadow-[0_3px_8px_rgba(237,106,46,0.3)]"
            aria-label="Profile"
          >
            {initial}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
