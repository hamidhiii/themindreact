import { useMemo, useState } from 'react';
import { useGetAttendanceQuery } from '../../../store/api/dashboardApi';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

type AttendanceFilter = 'all' | 'attended' | 'absent';

const filterOptions: { value: AttendanceFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'attended', label: 'Came' },
    { value: 'absent', label: 'Absent' },
];

function normalizeDate(value: string) {
    return value ? value.slice(0, 10) : '';
}

function formatDateLabel(value: string) {
    const normalized = normalizeDate(value);
    if (!normalized) return '-';
    const [, month, day] = normalized.split('-');
    return month && day ? `${day}.${month}` : normalized;
}

export default function HomeAttendanceChart() {
    const { data = [], isLoading } = useGetAttendanceQuery();
    const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
    const [dateFilter, setDateFilter] = useState('');

    const filteredData = useMemo(
        () => data.filter((d) => !dateFilter || normalizeDate(d.date) === dateFilter),
        [data, dateFilter],
    );

    const chartData = useMemo(
        () =>
            filteredData.map((d) => ({
                date: formatDateLabel(d.date),
                Came: d.attended,
                Absent: d.absent,
            })),
        [filteredData],
    );

    const totals = useMemo(() => {
        const attended = filteredData.reduce((sum, d) => sum + d.attended, 0);
        const absent = filteredData.reduce((sum, d) => sum + d.absent, 0);
        const total = attended + absent;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
        return { attended, absent, rate };
    }, [filteredData]);

    const hasServerData = data.length > 0;
    const isEmpty = !isLoading && chartData.length === 0;

    return (
        <div className="bg-white rounded-[18px] border border-[#F0F1F5] p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-[15px] font-extrabold text-[#1A2233]">Attendance Statistics</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#F7F8FA] p-1">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setAttendanceFilter(option.value)}
                                className={`rounded-lg px-4 py-2 text-[11px] font-black transition-all ${
                                    attendanceFilter === option.value
                                        ? 'bg-white text-[#ED6A2E] shadow-sm'
                                        : 'text-[#8A9BB8] hover:text-[#1A2233]'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(event) => setDateFilter(event.target.value)}
                            className="rounded-xl border border-[#F0F1F5] bg-[#F7F8FA] px-3 py-2 text-[12px] font-bold text-[#1A2233] outline-none transition-all focus:border-[#ED6A2E]"
                        />
                        {dateFilter && (
                            <button
                                type="button"
                                onClick={() => setDateFilter('')}
                                className="rounded-xl border border-[#F0F1F5] px-3 py-2 text-[11px] font-black text-[#8A9BB8] transition-all hover:text-[#1A2233]"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {chartData.length > 0 && (
                        <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                            {[
                                { label: 'Came', value: totals.attended, color: '#2ECC81' },
                                { label: 'Absent', value: totals.absent, color: '#F37021' },
                                { label: 'Rate', value: `${totals.rate}%`, color: '#4C6FFF' },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-xl border px-3 py-2"
                                    style={{ backgroundColor: `${s.color}0D`, borderColor: `${s.color}33` }}
                                >
                                    <div className="text-[13px] font-black leading-tight" style={{ color: s.color }}>
                                        {s.value}
                                    </div>
                                    <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8A9BB8]">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <p className="text-[11px] font-semibold text-[#8A9BB8] mt-1">
                    Loading...
                </p>
            ) : isEmpty ? (
                <p className="mt-5 text-[11px] font-semibold text-[#8A9BB8]">
                    {hasServerData ? 'No attendance data for selected filters.' : 'No attendance data from the server.'}
                </p>
            ) : (
                <div className="mt-5 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F1F5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#8A9BB8', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#8A9BB8', fontWeight: 600 }}
                            />
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    fontSize: 11,
                                }}
                            />
                            {(attendanceFilter === 'all' || attendanceFilter === 'attended') && (
                                <Bar dataKey="Came" fill="#2ECC81" radius={[5, 5, 0, 0]} barSize={12} />
                            )}
                            {(attendanceFilter === 'all' || attendanceFilter === 'absent') && (
                                <Bar dataKey="Absent" fill="#F37021" radius={[5, 5, 0, 0]} barSize={12} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
