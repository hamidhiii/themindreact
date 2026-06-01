import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, AdminRoute, TeacherRoute } from './ProtectedRoutes';
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';

import AuthPage from '../pages/Auth/AuthPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AnalyticsDetailPage from '../pages/Analytics/AnalyticsDetailPage';
import HomePage from '../pages/Home/HomePage';
import StudentsPage from '../pages/Students/StudentsPage';
import StudentDetailsPage from '../pages/Students/StudentDetailsPage';
import LeadsPage from '../pages/Leads/LeadsPage';
import GroupsPage from '../pages/Groups/GroupsPage';
import GroupDetailsPage from '../pages/Groups/GroupDetailsPage';
import TeachersPage from '../pages/Teachers/TeachersPage';
import TeacherDetailsPage from '../pages/Teachers/TeacherDetailsPage';
import ExamsPage from '../pages/Exams/ExamsPage';
import SalaryPage from '../pages/Salary/SalaryPage';
import TariffPage from '../pages/Salary/TariffPage';
import TransactionsPage from '../pages/Transactions/TransactionsPage';
import WorkersPage from '../pages/Workers/WorkersPage';
import WorkerProfilePage from '../pages/Workers/WorkerProfilePage';
import TasksPage from '../pages/Tasks/TasksPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import SMSPage from '../pages/Settings/SMSPage';
import SMSNewUsersPage from '../pages/Settings/SMSNewUsersPage';
import BranchManagerPage from '../pages/Settings/BranchManagerPage';
import RolesPage from '../pages/Settings/RolesPage';
import AssignRolePage from '../pages/Settings/AssignRolePage';
import ExpensesPage from '../pages/Settings/ExpensesPage';
import FeedbackPage from '../pages/Settings/FeedbackPage';
import UserAccessPage from '../pages/Settings/UserAccessPage';
import NewsPage from '../pages/Settings/NewsPage';
import SendTaskPage from '../pages/Settings/SendTaskPage';
import MarketingAnalyticsPage from '../pages/Settings/MarketingAnalyticsPage';
import MarketingLeadsPage from '../pages/Settings/MarketingLeadsPage';
import RoomsPage from '../pages/Rooms/RoomsPage';
import RoomSchedulePage from '../pages/Rooms/RoomSchedulePage';
import AdminPenaltiesPage from '../pages/Penalties/AdminPenaltiesPage';
import MyPenaltiesPage from '../pages/Penalties/MyPenaltiesPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import TeacherHomePage from '../pages/Teacher/TeacherHomePage';
import TeacherTasksPage from '../pages/Teacher/TeacherTasksPage';
import TeacherExamsPage from '../pages/Teacher/TeacherExamsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/splash" element={<Navigate to="/" replace />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/the-mind" element={<DashboardPage />} />
              <Route path="/analytics-debtors-detail" element={<AnalyticsDetailPage />} />
              <Route path="/room-schedule" element={<RoomSchedulePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              <Route path="/active-leads" element={<LeadsPage />} />
              <Route path="/faol-lidlar" element={<Navigate to="/active-leads" replace />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/details/:studentId" element={<StudentDetailsPage />} />
              <Route path="/student-details/:id" element={<StudentDetailsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/details/:groupId" element={<GroupDetailsPage />} />
              <Route path="/group-details/:groupId" element={<GroupDetailsPage />} />

              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/exams/details/:examId" element={<ExamsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/teachers/details/:teacherId" element={<TeacherDetailsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/task-manager" element={<TasksPage />} />

              <Route path="/workers" element={<WorkersPage />} />
              <Route path="/workers/details/:workerId" element={<WorkerProfilePage />} />
              <Route path="/salary" element={<SalaryPage />} />
              <Route path="/tariff" element={<TariffPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/penalties" element={<AdminPenaltiesPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/sms-active-users" element={<SMSPage />} />
              <Route path="/sms-new-users" element={<SMSNewUsersPage />} />
              <Route path="/send-task" element={<SendTaskPage />} />
              <Route path="/branch-manager" element={<BranchManagerPage />} />
              <Route path="/create-role" element={<RolesPage />} />
              <Route path="/assign-role" element={<AssignRolePage />} />
              <Route path="/expense-options" element={<ExpensesPage />} />
              <Route path="/marketing-analytics" element={<MarketingAnalyticsPage />} />
              <Route path="/marketing-leads" element={<MarketingLeadsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/user-access" element={<UserAccessPage />} />
              <Route path="/rooms" element={<RoomsPage />} />

              <Route path="/" element={<Navigate to="/home" replace />} />
            </Route>
          </Route>

          <Route element={<TeacherRoute />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher-home" element={<TeacherHomePage />} />
              <Route path="/teacher-home/tasks" element={<TeacherTasksPage />} />
              <Route path="/teacher-home/exams" element={<TeacherExamsPage />} />
              <Route path="/teacher-home/penalties" element={<MyPenaltiesPage />} />
              <Route path="/teacher-home/notifications" element={<NotificationsPage />} />
              <Route path="/teacher-home/groups/:groupId" element={<GroupDetailsPage />} />

              <Route path="/support-teacher-home" element={<TeacherHomePage />} />
              <Route path="/support-teacher-home/tasks" element={<TeacherTasksPage />} />
              <Route path="/support-teacher-home/exams" element={<TeacherExamsPage />} />
              <Route path="/support-teacher-home/penalties" element={<MyPenaltiesPage />} />
              <Route path="/support-teacher-home/groups/:groupId" element={<GroupDetailsPage />} />

              <Route path="/" element={<Navigate to="/teacher-home" replace />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/the-mind" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
