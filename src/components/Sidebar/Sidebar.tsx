import type { ElementType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Home,
  BarChart2,
  UserPlus,
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CheckSquare,
  Briefcase,
  DollarSign,
  ArrowLeftRight,
  Settings,
  LogOut,
  X,
  Menu,
  Receipt,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store/store';
import logo from '../../assets/logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/home', label: 'Home', icon: Home },
      { to: '/the-mind', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'STUDENTS',
    items: [
      { to: '/active-leads', label: 'Lead', icon: UserPlus },
      { to: '/students', label: 'Students', icon: Users },
      { to: '/groups', label: 'Group', icon: BookOpen },
    ],
  },
  {
    label: 'ACADEMY',
    items: [
      { to: '/exams', label: 'Exam', icon: ClipboardList },
      { to: '/teachers', label: 'Teacher', icon: GraduationCap },
      { to: '/tasks', label: 'Task', icon: CheckSquare },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/workers', label: 'Workers', icon: Briefcase },
      { to: '/salary', label: 'Salary', icon: DollarSign },
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/penalties', label: 'Penalties', icon: Receipt },
    ],
  },
  {
    label: 'SYSTEM',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function userInitial(username: string | null, role: string | null) {
  const source = username?.trim() || role?.trim() || 'User';
  return source[0]?.toUpperCase() ?? 'U';
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, username } = useSelector((s: RootState) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r border-[#F0F1F5] bg-white transition-transform duration-300 ease-in-out lg:w-20 lg:translate-x-0 min-[1100px]:w-[260px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 lg:justify-center lg:px-3 min-[1100px]:justify-between min-[1100px]:px-5">
          <button
            type="button"
            className="flex min-w-0 items-center justify-center"
            onClick={() => {
              navigate('/home');
              onClose();
            }}
          >
            <img
              src={logo}
              alt="The Mind"
              className="h-[60px] w-[168px] object-contain lg:h-[62px] lg:w-[62px] min-[1100px]:h-[60px] min-[1100px]:w-[168px]"
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[#F5F6FA] lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} className="text-[#8A9BB8]" />
          </button>
        </div>

        <div className="h-px bg-[#F0F1F5]" />

        <nav className="scrollbar-hide flex-1 overflow-y-auto px-3 py-2 lg:px-2 min-[1100px]:px-3">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="mt-4 first:mt-2">
              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-[1px] text-[#8A9BB8] lg:hidden min-[1100px]:block">
                {group.label}
              </div>
              <div className="hidden justify-center py-3 lg:flex min-[1100px]:hidden">
                <span className="h-px w-5 rounded-full bg-[#F0F1F5]" />
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-[10px] px-3 py-[11px] text-[13px] font-medium transition-all duration-150 lg:justify-center lg:px-0 min-[1100px]:justify-start min-[1100px]:px-3 ${
                        isActive
                          ? 'border border-[#ED6A2E]/20 bg-[#ED6A2E]/[0.07] text-[#1A2233]'
                          : 'text-[#8A9BB8] hover:bg-[#1A2233]/[0.04] hover:text-[#1A2233]/80'
                      }`
                    }
                    title={item.label}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`mr-[10px] h-[18px] w-[3px] rounded-sm transition-all lg:hidden min-[1100px]:block ${
                            isActive ? 'bg-[#ED6A2E]' : 'bg-transparent'
                          }`}
                        />
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? 'text-[#ED6A2E]'
                              : 'text-[#8A9BB8] transition-colors group-hover:text-[#1A2233]/80'
                          }
                        />
                        <span className="ml-[11px] flex-1 truncate lg:hidden min-[1100px]:block">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="hidden h-1.5 w-1.5 rounded-full bg-[#ED6A2E] min-[1100px]:block" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#F0F1F5] bg-white px-3 pb-4 pt-3">
          <div className="hidden justify-center lg:flex min-[1100px]:hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ED6A2E]/10 text-[#ED6A2E] transition-colors hover:bg-[#ED6A2E]/15"
              title="Log out"
              aria-label="Log out"
            >
              <span className="text-sm font-bold">
                {userInitial(username, role)}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-[14px] border border-[#F0F1F5] bg-[#F5F6FA] p-3 lg:hidden min-[1100px]:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] shadow-[0_4px_8px_rgba(237,106,46,0.3)]">
              <span className="text-sm font-extrabold uppercase text-white">
                {userInitial(username, role)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-[#1A2233]">
                {username || 'User'}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[#8A9BB8]">
                {role || 'Admin'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-[#8A9BB8] transition-colors hover:bg-white hover:text-[#ED6A2E]"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl p-2 transition-colors hover:bg-white/70 lg:hidden"
      aria-label="Open menu"
    >
      <Menu size={22} className="text-[#1A2233]" />
    </button>
  );
}
