// ── App Colors ────────────────────────────────────────────────────────────────
export const AppColors = {
  bgColor: '#F0F2F8',
  cardColor: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#7D7D7D',
  mainColor: '#FD802E',
} as const;

// ── App Pages ─────────────────────────────────────────────────────────────────
export const AppPages = {
  splash: '/splash',
  auth: '/auth',
  theMind: '/the-mind',
  home: '/home',
  faolLidlar: '/faol-lidlar',
  students: '/students',
  studentDetails: '/student-details',
  groups: '/groups',
  groupDetails: '/group-details',
  exams: '/exams',
  teachers: '/teachers',
  tasks: '/tasks',
  workers: '/workers',
  salary: '/salary',
  tariff: '/tariff',
  transactions: '/transactions',
  profile: '/profile',
  settings: '/settings',
  taskManager: '/task-manager',
  news: '/news',
  smsActiveUsers: '/sms-active-users',
  smsNewUsers: '/sms-new-users',
  sendTask: '/send-task',
  feedback: '/feedback',
  branchManager: '/branch-manager',
  createRole: '/create-role',
  assignRole: '/assign-role',
  expenseOptions: '/expense-options',
  marketingAnalytics: '/marketing-analytics',
  userAccess: '/user-access',
  teacherHome: '/teacher-home',
  teacherTasks: '/teacher-home/tasks',
  teacherExams: '/teacher-home/exams',
} as const;

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
  user?: CurrentUser;
}

export interface CurrentUser {
  id: number;
  username: string;
  fullName?: string;
  telegramUsername?: string;
  phone?: string;
  systemRole: string;
  currentBranchId?: number;
  permissions: Record<string, Record<string, boolean>>;
  branches: Record<string, unknown>[];
}

export type AuthErrorType =
  | 'network'
  | 'server'
  | 'invalidCredentials'
  | 'badRequest'
  | 'timeout'
  | 'unknown';

export type AuthStateStatus = 'initial' | 'loading' | 'success' | 'error';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  username: string | null;
  isLoggedIn: boolean;
  status: AuthStateStatus;
  errorMessage: string | null;
  errorType: AuthErrorType;
}

// ── Home Dashboard Models ─────────────────────────────────────────────────────
export interface DashboardStatsModel {
  leads: number;
  students: number;
  waiting: number;
  newStudents: number;
}

export interface FinanceModel {
  expected: number;
  paid: number;
  remaining: number;
  progress: number;
}

export interface WeeklyModel {
  date: string;
  day: string;
  dayIndex: number;
  count: number;
  graphCount?: number;
  fillPercent?: number;
  maxDailyCapacity?: number;
  overflowCount?: number;
  leadsCameCount: number;
  trialDoneCount: number;
  leadsStatusCount: number;
  trialsCount: number;
  trialLeadsCount?: number;
  lessonCount: number;
  leadStatus: string;
}

export interface TrialStatsModel {
  title: string;
  subtitle: string;
  enrolled: number;
  coming: number;
  arrived: number;
  total: number;
  leads: number;
  waiting: number;
  came: number;
  notCame: number;
  weekly: WeeklyModel[];
}

export interface ActionModel {
  type: string;
  label: string;
}

export interface SearchItemModel {
  id: unknown;
  name: string;
  detail: string;
}

export interface SearchModel {
  students: SearchItemModel[];
  leads: SearchItemModel[];
  groups: SearchItemModel[];
  exams: SearchItemModel[];
  teachers: SearchItemModel[];
  workers: SearchItemModel[];
}

export interface BuildDebtorsTableModels {
  name: string;
  phone: string;
  teacher: string;
  group: string;
  balance: string;
  status: string;
  called: boolean;
}

export interface BuildTrialLessonModels {
  name: string;
  phone: string;
  teacher: string;
  group: string;
  balance: string;
  status: string;
  called: boolean;
}

export interface StudentModelHome {
  id: number;
  name: string;
  phone: string;
  group: string;
  teacher: string;
  balance: string;
  status: string;
  called: boolean;
  missedLessons: number;
}

// ── Dashboard Home State ──────────────────────────────────────────────────────
export interface DashboardHomeState {
  isLoading: boolean;
  error: string | null;
  stats: DashboardStatsModel | null;
  students: StudentModelHome[];
  trialStudents: StudentModelHome[];
  debtorStudents: StudentModelHome[];
  absentStudents: StudentModelHome[];
  search: SearchModel | null;
  actions: ActionModel[];
  finance: FinanceModel | null;
  weekly: WeeklyModel[];
  trial: TrialStatsModel | null;
}

// ── Main The Mind Models ──────────────────────────────────────────────────────
export interface MainDashboardStatsModel {
  leads: number;
  students: number;
  trial: number;
  debtors: number;
  groups: number;
  books: number;
}

export interface IncomeSeriesPoint {
  label: string;
  value: number;
}

export interface FinanceAnalyticsModel {
  studentNew: number;
  studentExisting: number;
  cash: number;
  card: number;
  online: number;
  total: number;
  cashPercent: number;
  cardPercent: number;
  onlinePercent: number;
  yearSeries: IncomeSeriesPoint[];
  monthSeries: IncomeSeriesPoint[];
  incomeYear: number;
  incomeMonth: number;
}

export interface RoomModel {
  id?: number;
  name: string;
  capacity?: number;
  color?: string;
  startTime?: string;
  endTime?: string;
  groups?: RoomGroupModel[];
}

export interface ExpenseModel {
  id: number;
  name: string;
  amount: number;
  category?: string;
  date?: string;
  createdAt?: string;
  comment?: string;
}

export interface RoomSettingModel {
  id: number;
  name: string;
  color: string;
  startTime: string;
  endTime: string;
}

export interface PenaltyTypeModel {
  id: string;
  name: string;
  defaultAmount: string;
  isActive: boolean;
}

export interface PenaltyModel {
  id: string;
  teacher: string;
  teacherName?: string;
  penaltyType: string;
  penaltyTypeName?: string;
  amount: string;
  penaltyDate: string;
  note?: string;
}

export interface PenaltyDayEntry {
  id: string;
  amount: string;
  penaltyTypeName?: string;
  note?: string;
}

export interface PenaltyHistoryTeacherRow {
  id: string;
  name: string;
  role: string;
  penalties: Record<string, PenaltyDayEntry[]>;
}

export interface PenaltyHistoryResponse {
  teachers: PenaltyHistoryTeacherRow[];
  totalTeachers: number;
}

export interface PenaltyTeacherChoice {
  id: string;
  name: string;
  role: string;
}

export interface RoomGroupModel {
  groupName: string;
  teacher: string;
  startTime: string;
  endTime: string;
}

export interface RoomScheduleRoomModel {
  roomName: string;
  colorHex?: string;
  groups: RoomGroupModel[];
}

export interface RoomScheduleResponse {
  rooms: RoomScheduleRoomModel[];
}

export interface SalesFunnelModel {
  requests: number;
  trialArrived: number;
  trialLeft: number;
  paid: number;
  conversion: number;
}

export interface AttendanceEntity {
  date: Date;
  attended: number;
  absent: number;
}

export interface AttendanceStatModel {
  date: string;
  present: number;
  attended: number;
  absent: number;
  total: number;
  rate: number;
}

export interface ScheduleEvent {
  room: string;
  startRow: number;
  duration: number;
}

export interface BooksAnalyticsStat {
  type: string;
  label: string;
  value: number;
}

export interface BooksActionConfig {
  label: string;
  endpoint: string;
  method: string;
}

export interface BooksAnalyticsModel {
  title: string;
  subtitle: string;
  totalBooks: number;
  issuedBooks: number;
  returnedBooks: number;
  overdueBooks: number;
  cards: BooksAnalyticsStat[];
  addBookAction: BooksActionConfig;
}

export interface BookItemModel {
  id: number;
  title: string;
  author: string;
  categoryId?: number;
  category: string;
  copies: number;
  salePrice: string;
  code: string;
  issued: number;
  returned: number;
  overdue: number;
}

export interface BookCategoryModel {
  id: number;
  name: string;
}

export interface BooksModalTab {
  value: string;
  label: string;
}

export interface BooksModalActions {
  searchEndpoint: string;
  categoriesEndpoint: string;
  submitEndpoint: string;
}

export interface BooksModalConfig {
  title: string;
  subtitle: string;
  tabs: BooksModalTab[];
  defaultCategories: string[];
  categories: BookCategoryModel[];
  existingBooks: BookItemModel[];
  actions: BooksModalActions;
}

// ── Dashboard Actions Config ──────────────────────────────────────────────────
export interface DashboardActionItem {
  type: string;
  label: string;
  method: string;
  endpoint: string;
  badgeCount?: number;
}

export interface DashboardNotificationConfig {
  unreadCount: number;
  listEndpoint: string;
  unreadCountEndpoint: string;
  markAllReadEndpoint: string;
}

export interface DashboardActionsConfig {
  searchEndpoint: string;
  addMenu: DashboardActionItem[];
  topbarButtons: DashboardActionItem[];
  notification: DashboardNotificationConfig;
  items: DashboardActionItem[];
}

// ── Exams ─────────────────────────────────────────────────────────────────────
export interface ExamModel {
  id: string;
  title: string;
  group: number;
  groupName: string;
  teacher: string;
  teacherName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  passScore: number;
  isPercentage: boolean;
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  resultsCount: number;
  passedCount: number;
  failedCount: number;
}

export interface CreateExamRequest {
  title: string;
  group: number;
  examDate: string;
  startTime: string;
  endTime: string;
  passScore: number;
  isPercentage: boolean;
  isActive: boolean;
  createdBy: string;
}

// ── Groups ────────────────────────────────────────────────────────────────────
export interface GroupModel {
  id?: number;
  name?: string;
  level?: string;
  levelDisplay?: string;
  teacher?: string;
  teacherName?: string;
  weekDays?: string;
  studentCount?: number;
  room?: number;
  roomName?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  createdAt?: string;
  teacherFixedSalary?: string;
}

export interface GroupDetailsState {
  group: GroupModel;
  students: Record<string, unknown>[];
  attendance: Record<string, unknown>[];
}

export interface LessonModel {
  id?: number;
  name?: string;
  date?: string;
  [key: string]: unknown;
}

export interface GroupStudentModel {
  id?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tariff?: string;
  discount?: string;
  balance?: string;
  attendance?: string;
  [key: string]: unknown;
}

export interface GroupTeacherModel {
  name?: string;
  balance?: string;
  [key: string]: unknown;
}

// ── Students ──────────────────────────────────────────────────────────────────
export interface StudentModel {
  id?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  parentPhone?: string;
  status: string;
  statusDisplay?: string;
  birthDate?: string;
  gender?: string;
  district?: number;
  source?: string;
  notes?: string;
  joinedAt?: string;
  createdAt?: string;
  groupId?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  courseId?: string;
  courseName?: string;
  groupPrice?: string;
  discountAmount?: string;
  finalPrice?: string;
  paidAmount?: string;
  balance: string;
  debtStatus?: string;
}

export interface BuildStudentsTableItem {
  id: number;
  name: string;
  group: string;
  teacher: string;
  balance: string;
  phone: string;
  status: string;
  called: boolean;
  missedLessons: number;
}

export interface StudentHistoryModel {
  studentId: string;
  count: number;
  results: HistoryItemModel[];
}

export interface HistoryItemModel {
  type: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface PaymentModel {
  id?: number;
  studentId: number;
  groupId: string;
  administratorId: string;
  amount: string;
  payWith: string;
  paymentMonth: string;
  checkGiven: boolean;
  studentName?: string;
  groupName?: string;
  administratorName?: string;
  createdAt?: string;
}

export interface StudentRecordModel {
  studentId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  classScore?: number;
  homeworkScore?: number;
  attendance: string;
  absenceReason: string;
}

export interface JournalModel {
  id?: number;
  group: number;
  groupName: string;
  lessonDate: string;
  notes: string;
  studentRecords: StudentRecordModel[];
}

export interface StudentScoreModel {
  id: number;
  studentId: number;
  studentName: string;
  attendance: string;
  classScore?: number;
  homeworkScore?: number;
  absenceReason: string;
}

export interface DashboardModel {
  month: string;
  cards: Cards;
}

export interface Cards {
  activeLeads: number;
  activeStudents: number;
  debtors: number;
  totalDebt: string;
  groups: number;
}

export interface AnalyticItem {
  title: string;
  value: string;
  sub: string;
  subPositive?: boolean;
  icon: string;
  iconColor: string;
}

// ── Leads / Lids ──────────────────────────────────────────────────────────────
export interface LidModel {
  id?: number;
  firstName: string;
  phone?: string;
  status: string;
  statusDisplay?: string;
  source?: string;
  comment?: string;
  date?: string;
  branch?: number;
  destination?: string;
  gender?: string;
  course?: number;
  giveBook: boolean;
  trialGroup?: number | string;
  trialGroupName?: string;
  callCount?: number;
  isArchived?: boolean;
  came?: boolean;
  telegramUsername?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  goal?: string;
  preferredDays?: string;
  preferredTimeSlot?: string;
  createdAt?: string;
}

export interface LeadPipelineSummary {
  leads: number;
  waiting: number;
  calling: number;
  archived: number;
}

export interface LidGroupModel {
  id: string;
  name: string;
  teacherName: string;
  studentsCount: number;
  isExamNow: boolean;
  lessonTime: string;
  evenWeeks: boolean;
  daysPerWeek: number;
}

export interface LidKursModel {
  id?: number;
  name: string;
  price: string;
}

export interface LeadChoiceItem {
  value: string;
  label: string;
}

export interface LeadGroupItem {
  id: number;
  name: string;
}

export interface LeadBookItem {
  id: number;
  name: string;
  stock: number;
}

export interface LeadChoicesModel {
  groupRequiredStatuses: string[];
  statuses: LeadChoiceItem[];
  sources: LeadChoiceItem[];
  genders: LeadChoiceItem[];
  goals?: LeadChoiceItem[];
  preferredDays?: LeadChoiceItem[];
  preferredTimes?: LeadChoiceItem[];
  groups: LeadGroupItem[];
  books: LeadBookItem[];
}

// ── Salary ────────────────────────────────────────────────────────────────────
export interface SalaryDashboardModel {
  totalIncome: number;
  monthlyIncome: number;
  totalExpenses: number;
  totalDebt: number;
}

export interface SalaryReportModel {
  name: string;
  role: string;
  salary: number;
  bonus: number;
  fine: number;
  total: number;
  status: string;
}

export interface StaffSalaryModel {
  id: number;
  userId: string;
  username: string;
  userFullName: string;
  salaryType: string;
  salaryTypeDisplay: string;
  fixedAmount?: number;
  percentage?: number;
  isActive: boolean;
}

export interface TariffModel {
  id?: number;
  name: string;
  price: string;
  durationMonths: number;
  durationLabel?: string;
  type: string;
  description: string;
  isActive: boolean;
  isPopular: boolean;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export interface TaskApiModel {
  id: string;
  title: string;
  description: string;
  status: string;
  statusDisplay: string;
  tag?: string;
  tagDisplay?: string;
  priority: string;
  priorityDisplay: string;
  deadline?: string;
  isCompleted: boolean;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
}

export const kApiStatuses = ['todo', 'in_progress', 'review', 'done'] as const;
export const kStatusLabels = ['Need to do', 'In progress', 'Under review', 'Done'] as const;
export const kStatusColors = ['#6B7FD4', '#FF9800', '#9B59B6', '#2ECC8A'] as const;

export function kStatusIndex(status: string): number {
  const i = kApiStatuses.indexOf(status as typeof kApiStatuses[number]);
  return i === -1 ? 0 : i;
}

export function kTagColor(tag?: string): string {
  if (!tag) return '#8A94A6';
  switch (tag.toLowerCase()) {
    case 'design': return '#FF9800';
    case 'dev':
    case 'development': return '#2ECC8A';
    case 'qa': return '#9B59B6';
    case 'marketing': return '#6B7FD4';
    case 'devops': return '#3498DB';
    case 'hr': return '#E91E63';
    default: return '#8A94A6';
  }
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export interface TeacherModel {
  id: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  userId?: string;
  isActive: boolean;
  isSupport: boolean;
  experienceYear: number;
  education: string;
  createdAt: string;
}

export interface TeacherGroupItemModel {
  id: number;
  name: string;
  studentCount: number;
}

export interface TodayLessonModel {
  id?: number;
  time: string;
  name: string;
  subtitle: string;
  type: string;
  status: string;
  isGroup: boolean;
}

export interface TeacherHistorySummary {
  totalLessons: number;
  ownLessons: number;
  substituteLessons: number;
  totalAmount: string;
}

export interface TeacherHistoryItem {
  journalId?: number;
  lessonId?: number;
  lessonDate: string;
  groupId: number;
  groupName: string;
  studentCount: number;
  salaryType: string;
  salaryValue: number;
  lessonAmount: number;
  isSubstitute: boolean;
}

export interface TeacherDashboardModel {
  balance: string;
  fine: string;
  fineReason?: string;
  lessonsThisMonth: number;
  studentsCount: number;
  groups: TeacherGroupItemModel[];
  todayLessons: TodayLessonModel[];
  historySummary?: TeacherHistorySummary;
  history: TeacherHistoryItem[];
}

export interface TeacherJournalModel {
  id?: number;
  group: number;
  groupName: string;
  lesson?: number;
  lessonDate: string;
  notes: string;
  studentRecords: unknown[];
}

export interface TeacherFinancialModel {
  teacherName: string;
  studentsCount: number;
  income: number;
  salary: number;
  profit: number;
}

// ── Transactions ──────────────────────────────────────────────────────────────
export interface TransactionModel {
  id: number;
  studentName: string;
  groupName: string;
  amount: string;
  payWith: string;
  payWithDisplay: string;
  createdAt: string;
}

// ── Workers / Admins ──────────────────────────────────────────────────────────
export interface AdminModel {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: string;
  roleDisplay: string;
  phoneNumber?: string;
  teacherId?: string;
  isActive: boolean;
}

export interface WorkerFinanceModel {
  workerId: string;
  fullName: string;
  currentBalance: number;
  salary: number;
  bonus: number;
  penalty: number;
  nextPaymentDate: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType = 'message' | 'task';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  deadline?: Date;
  fromUserId?: string;
  toUserId?: string;
  isCompleted: boolean;
}

export interface TaskNotificationModel {
  id: string;
  title?: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
  message: string;
  isRead: boolean;
  createdBy?: string;
  modifiedBy?: string;
  user?: string;
  task?: string;
  taskTitle?: string;
}
