import { useMemo } from 'react';
import { useGetAttendanceQuery } from '../../../store/api/dashboardApi';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

export default function HomeAttendanceChart() {
    const { data = [], isLoading } = useGetAttendanceQuery();

    const chartData = useMemo(
        () =>
            data.map((d) => ({
                date: d.date.slice(5),
                Attended: d.attended,
                Absent: d.absent,
            })),
        [data],
    );

    const totals = useMemo(() => {
        const attended = data.reduce((sum, d) => sum + d.attended, 0);
        const absent = data.reduce((sum, d) => sum + d.absent, 0);
        const total = attended + absent;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
        return { attended, absent, rate };
    }, [data]);

    const isEmpty = !isLoading && chartData.length === 0;

    return (
        <div className="bg-white rounded-[18px] border border-[#F0F1F5] p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
            <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isEmpty ? '' : 'mb-4'}`}>
                <h3 className="text-[15px] font-extrabold text-[#1A2233]">Attendance Statistics</h3>
                {chartData.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Attended', value: totals.attended, color: '#2ECC81' },
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
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[#8A9BB8] mt-0.5">
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <p className="text-[11px] font-semibold text-[#8A9BB8] mt-1">
                    Loading...
                </p>
            ) : isEmpty ? (
                <p className="text-[11px] font-semibold text-[#8A9BB8] mt-1">
                    No attendance data from the server.
                </p>
            ) : (
                <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    fontSize: 11,
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="Attended" fill="#2ECC81" radius={[4, 4, 0, 0]} barSize={8} />
                            <Bar dataKey="Absent" fill="#F37021" radius={[4, 4, 0, 0]} barSize={8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
