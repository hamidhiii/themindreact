import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { SidebarToggle } from '../components/Sidebar/Sidebar';
import TopActions from '../components/common/TopActions';
import { ensureDefaultBranch } from '../utils/branchContext';

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
  ['/the-mind', 'Analytics'],
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
  const location = useLocation();

  useEffect(() => {
    ensureDefaultBranch();
  }, []);
  const title = useMemo(() => pageTitle(location.pathname), [location.pathname]);
  const isHomePage = location.pathname.startsWith('/home');
  const hideHeaderTitle =
    isHomePage ||
    location.pathname.startsWith('/active-leads') ||
    location.pathname.startsWith('/analytics-debtors-detail');

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-20 min-[1100px]:ml-[260px]">
        {/* Mobile header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 bg-bg-app px-3 lg:hidden">
          <SidebarToggle onClick={() => setSidebarOpen(true)} />
          {isHomePage ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-extrabold text-[#1A2233]">Overview</p>
            </div>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-[16px] font-extrabold text-[#1A2233]">
              {title}
            </h1>
          )}
          <TopActions compact showSearch={isHomePage} showAdd />
        </header>

        {/* Desktop header */}
        <header className="hidden min-h-[72px] shrink-0 items-center gap-4 border-b border-[#F0F1F5] bg-white px-6 py-3 lg:flex">
          {isHomePage ? (
            <div className="shrink-0 min-w-[220px]">
              <h1 className="text-[22px] font-extrabold text-[#1A2233] tracking-tight leading-tight">
                Overview of indicators
              </h1>
              <p className="text-[11px] text-[#8A9BB8] font-semibold mt-0.5">
                Trial lessons today · New active students this month
              </p>
            </div>
          ) : !hideHeaderTitle ? (
            <h1 className="shrink-0 truncate text-[16px] font-extrabold text-[#1A2233] min-w-[180px]">
              {title}
            </h1>
          ) : null}
          <TopActions showSearch={isHomePage} showAdd className="flex-1" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-5 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
