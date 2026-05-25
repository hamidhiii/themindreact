import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

function isTeacherRole(role: string | null) {
    return role === 'teacher' || role === 'support_teacher';
}

export function PrivateRoute() {
    const { isLoggedIn } = useSelector((s: RootState) => s.auth);
    return isLoggedIn ? <Outlet /> : <Navigate to="/auth" replace />;
}

export function AdminRoute() {
    const { role } = useSelector((s: RootState) => s.auth);
    return !isTeacherRole(role) ? <Outlet /> : <Navigate to={role === 'support_teacher' ? '/support-teacher-home' : '/teacher-home'} replace />;
}

export function TeacherRoute() {
    const { role } = useSelector((s: RootState) => s.auth);
    return isTeacherRole(role) ? <Outlet /> : <Navigate to="/the-mind" replace />;
}
