import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
import type {
  SalaryDashboardModel,
  SalaryReportModel,
  StaffSalaryModel,
  TariffModel,
  FinanceAnalyticsModel,
  IncomeSeriesPoint,
} from '../../types';

function parseSalaryDashboard(j: Record<string, unknown>): SalaryDashboardModel {
  return {
    totalIncome: Number(j['total_income'] ?? j['income_total'] ?? j['income'] ?? 0),
    monthlyIncome: Number(j['monthly_income'] ?? j['month_income'] ?? j['income_month'] ?? 0),
    totalExpenses: Number(j['total_expenses'] ?? j['expenses_total'] ?? j['expense_total'] ?? 0),
    totalDebt: Number(j['total_debt'] ?? j['debt_total'] ?? 0),
  };
}

function parseSalaryReport(j: Record<string, unknown>): SalaryReportModel {
  return {
    name: (j['name'] ?? '') as string,
    role: (j['role'] ?? '') as string,
    salary: Number(j['salary'] ?? 0),
    bonus: Number(j['bonus'] ?? 0),
    fine: Number(j['fine'] ?? 0),
    total: Number(j['total'] ?? 0),
    status: (j['status'] ?? '') as string,
  };
}

function parseTariff(j: Record<string, unknown>): TariffModel {
  return {
    id: j['id'] as number | undefined,
    name: (j['name'] ?? '') as string,
    price: String(j['price'] ?? ''),
    durationMonths: Number(j['duration_months'] ?? 0),
    durationLabel: j['duration_label'] as string | undefined,
    type: (j['type'] ?? '') as string,
    description: (j['description'] ?? '') as string,
    isActive: (j['is_active'] ?? true) as boolean,
    isPopular: (j['is_popular'] ?? false) as boolean,
  };
}

function parseStaffSalary(j: Record<string, unknown>): StaffSalaryModel {
  const teacher = (j['teacher'] && typeof j['teacher'] === 'object'
    ? j['teacher']
    : {}) as Record<string, unknown>;
  const userRaw = j['user'] ?? j['teacher_id'] ?? teacher['id'];
  const fixedRaw = j['fixed_amount'] ?? j['amount'] ?? j['monthly_salary'];
  return {
    id: Number(j['id'] ?? 0),
    userId: userRaw != null ? String(userRaw) : '',
    username: String(j['username'] ?? j['teacher_username'] ?? teacher['username'] ?? ''),
    userFullName: String(
      j['user_full_name'] ??
      j['teacher_name'] ??
      j['full_name'] ??
      j['name'] ??
      teacher['full_name'] ??
      teacher['name'] ??
      ''
    ),
    salaryType: String(j['salary_type'] ?? ''),
    salaryTypeDisplay: String(j['salary_type_display'] ?? ''),
    fixedAmount: fixedRaw != null ? Number(fixedRaw) : undefined,
    percentage: j['percentage'] != null ? Number(j['percentage']) : undefined,
    isActive: j['is_active'] !== false,
  };
}

function parseIncomeSeriesPoint(j: Record<string, unknown>): IncomeSeriesPoint {
  return {
    label: (j['label'] ?? j['month'] ?? j['date'] ?? '') as string,
    value: Number(j['value'] ?? j['amount'] ?? 0),
  };
}

function parseFinanceAnalytics(j: Record<string, unknown>): FinanceAnalyticsModel {
  const total = Number(j['total'] ?? 0);
  const cash = Number(j['cash'] ?? 0);
  const card = Number(j['card'] ?? 0);
  const online = Number(j['online'] ?? 0);
  const yearSeriesRaw = Array.isArray(j['year_series']) ? (j['year_series'] as Record<string, unknown>[]) : [];
  const monthSeriesRaw = Array.isArray(j['month_series']) ? (j['month_series'] as Record<string, unknown>[]) : [];
  return {
    studentNew: Number(j['student_new'] ?? j['new_students'] ?? 0),
    studentExisting: Number(j['student_existing'] ?? j['existing_students'] ?? 0),
    cash,
    card,
    online,
    total,
    cashPercent: total > 0 ? cash / total : 0,
    cardPercent: total > 0 ? card / total : 0,
    onlinePercent: total > 0 ? online / total : 0,
    yearSeries: yearSeriesRaw.map(parseIncomeSeriesPoint),
    monthSeries: monthSeriesRaw.map(parseIncomeSeriesPoint),
    incomeYear: Number(j['income_year'] ?? 0),
    incomeMonth: Number(j['income_month'] ?? 0),
  };
}

function tariffToBody(data: {
  name: string;
  price: string;
  durationMonths: number;
  type: string;
  description: string;
  isActive: boolean;
  isPopular: boolean;
}): Record<string, unknown> {
  return {
    name: data.name,
    price: data.price,
    duration_months: data.durationMonths,
    type: data.type,
    description: data.description,
    is_active: data.isActive,
    is_popular: data.isPopular,
  };
}

export const salaryApi = createApi({
  reducerPath: 'salaryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Salary', 'Tariff', 'StaffSalary'],
  endpoints: (builder) => ({
    getSalaryDashboard: builder.query<SalaryDashboardModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.salarySummary },
            { url: '/teacher/salary/dashboard/' },
          ],
          (raw) => parseSalaryDashboard(raw as Record<string, unknown>)
        ),
      providesTags: ['Salary'],
    }),
    getSalaryReport: builder.query<SalaryReportModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.salaryHistory },
            { url: '/salary/report/' },
          ],
          (raw) => extractMapList(raw).map(parseSalaryReport)
        ),
      providesTags: ['Salary'],
    }),
    getTariffs: builder.query<TariffModel[], void>({
      query: () => ({ url: ApiPaths.salaryTariffs }),
      providesTags: ['Tariff'],
      transformResponse: (raw) => extractMapList(raw).map(parseTariff),
    }),
    getTariffById: builder.query<TariffModel, number>({
      query: (id) => ({ url: ApiPaths.salaryTariff(id) }),
      providesTags: ['Tariff'],
      transformResponse: (raw) => parseTariff(raw as Record<string, unknown>),
    }),
    createTariff: builder.mutation<void, {
      name: string;
      price: string;
      durationMonths: number;
      type: string;
      description: string;
      isActive: boolean;
      isPopular: boolean;
    }>({
      query: (data) => ({
        url: ApiPaths.salaryTariffs,
        method: 'POST',
        data: tariffToBody(data),
      }),
      invalidatesTags: ['Tariff'],
    }),
    updateTariff: builder.mutation<void, {
      id: number;
      name: string;
      price: string;
      durationMonths: number;
      type: string;
      description: string;
      isActive: boolean;
      isPopular: boolean;
    }>({
      query: (data) => ({
        url: ApiPaths.salaryTariff(data.id),
        method: 'PATCH',
        data: tariffToBody(data),
      }),
      invalidatesTags: ['Tariff'],
    }),
    deleteTariff: builder.mutation<void, number>({
      query: (id) => ({ url: ApiPaths.salaryTariff(id), method: 'DELETE' }),
      invalidatesTags: ['Tariff'],
    }),
    patchTariff: builder.mutation<void, { id: number; data: Partial<TariffModel> }>({
      query: ({ id, data }) => ({ url: ApiPaths.salaryTariff(id), method: 'PATCH', data }),
      invalidatesTags: ['Tariff'],
    }),
    getStaffSalaries: builder.query<StaffSalaryModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.salaryEmployees },
            { url: '/teacher/salary/teachers/' },
          ],
          (raw) => extractMapList(raw).map(parseStaffSalary)
        ),
      providesTags: ['StaffSalary'],
    }),
    createStaffSalary: builder.mutation<StaffSalaryModel, Partial<StaffSalaryModel> & { userId: string }>({
      query: (data) => ({
        url: ApiPaths.salaryEmployees,
        method: 'POST',
        data: {
          user: data.userId,
          teacher: data.userId,
          salary_type: data.salaryType ?? 'fixed',
          fixed_amount: data.fixedAmount?.toString() ?? '0',
          percentage: data.percentage?.toString(),
          is_active: data.isActive ?? true,
        },
      }),
      invalidatesTags: ['StaffSalary'],
      transformResponse: (raw) => parseStaffSalary(raw as Record<string, unknown>),
    }),
    patchStaffSalary: builder.mutation<StaffSalaryModel, { id: number; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: ApiPaths.salaryEmployee(id),
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['StaffSalary'],
      transformResponse: (raw) => parseStaffSalary(raw as Record<string, unknown>),
    }),
    payTeacherSalary: builder.mutation<void, { teacherId: string; amount: number; month: string; note?: string }>({
      queryFn: ({ teacherId, amount, month, note }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.salaryEmployeeStatus(teacherId),
              method: 'POST',
              data: { amount: Math.round(amount), month, ...(note ? { note } : {}) },
            },
            {
              url: `/teacher/salary/teachers/${teacherId}/pay/`,
              method: 'POST',
              data: { amount: Math.round(amount), month, ...(note ? { note } : {}) },
            },
          ],
          () => undefined
        ),
      invalidatesTags: ['StaffSalary', 'Salary'],
    }),
    getSalaryFinanceAnalytics: builder.query<FinanceAnalyticsModel, void>({
      query: () => ({ url: ApiPaths.salaryIncomeDynamics }),
      transformResponse: (raw) => parseFinanceAnalytics(raw as Record<string, unknown>),
    }),
  }),
});

export const {
  useGetSalaryDashboardQuery,
  useGetSalaryReportQuery,
  useGetTariffsQuery,
  useGetTariffByIdQuery,
  useCreateTariffMutation,
  useUpdateTariffMutation,
  useDeleteTariffMutation,
  usePatchTariffMutation,
  useGetStaffSalariesQuery,
  useCreateStaffSalaryMutation,
  usePatchStaffSalaryMutation,
  usePayTeacherSalaryMutation,
  useGetSalaryFinanceAnalyticsQuery,
} = salaryApi;
