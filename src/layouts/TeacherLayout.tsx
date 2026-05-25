import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  BookOpen,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';

const teacherTabs = [
  { to: '/teacher-home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher-home/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/teacher-home/exams', label: 'Exams', icon: BookOpen },
  { to: '/teacher-home/penalties', label: 'Penalties', icon: Gavel },
];

const supportTeacherTabs = [
  { to: '/support-teacher-home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/support-teacher-home/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/support-teacher-home/exams', label: 'Exams', icon: BookOpen },
  { to: '/support-teacher-home/penalties', label: 'Penalties', icon: Gavel },
];

function titleFor(pathname: string) {
  if (pathname.includes('/tasks')) return 'Tasks';
  if (pathname.includes('/exams')) return 'Exams';
  if (pathname.includes('/penalties')) return 'Penalties';
  if (pathname.includes('/groups')) return 'Group Journal';
  return pathname.startsWith('/support-teacher-home')
    ? 'Support Teacher'
    : 'Teacher Dashboard';
}

export default function TeacherLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSupport = location.pathname.startsWith('/support-teacher-home');
  const tabs = isSupport ? supportTeacherTabs : teacherTabs;
  const title = useMemo(() => titleFor(location.pathname), [location.pathname]);

  const signOut = () => {
    dispatch(logout());
    navigate('/auth');
  };

  const drawer = (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-[#F0F1F5] px-5">
        <BookOpen size={22} className="text-[#ED6A2E]" />
        <span className="text-[16px] font-extrabold text-[#1A2233]">
          {isSupport ? 'Support Teacher' : 'Teacher'}
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-[#8A9BB8] hover:bg-[#F5F6FA] lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[10px] px-4 py-[11px] text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#ED6A2E]/10 font-bold text-[#ED6A2E]'
                  : 'text-[#8A94A6] hover:bg-[#ED6A2E]/[0.06] hover:text-[#ED6A2E]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon size={18} />
                <span className="flex-1">{tab.label}</span>
                {isActive && <span className="h-1 w-1 rounded-full bg-[#ED6A2E]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-[10px] bg-red-500/[0.06] px-4 py-3 text-[13px] font-semibold text-red-500/80 transition-colors hover:bg-red-500/[0.1]"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F5F7]">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-[260px] border-r border-[#F0F1F5] bg-white shadow-[0_0_12px_rgba(0,0,0,0.06)] transition-transform duration-300 lg:w-[200px] lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {drawer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[200px]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 bg-[#F2F5F7] px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 hover:bg-white"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-[#1A2233]" />
          </button>
          <h1 className="truncate text-[20px] font-extrabold text-[#1A2233]">
            {title}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
