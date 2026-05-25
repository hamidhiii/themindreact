import { useGetAttendanceQuery } from '../../../store/api/dashboardApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { CalendarCheck } from 'lucide-react';

export default function HomeAttendanceChart() {
  const { data = [], isLoading } = useGetAttendanceQuery();

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    Attended: d.attended,
    Absent: d.absent,
    Rate: d.rate,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#F0F1F5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2ECC81]/15 flex items-center justify-center">
            <CalendarCheck size={20} className="text-[#2ECC81]" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#1A2233]">Attendance</h3>
            <p className="text-[11px] text-[#8A9BB8] font-medium">Last 14 days</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center text-[#8A9BB8] text-[12px]">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-[#8A9BB8] text-[12px]">No data</div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A9BB8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A9BB8' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Attended" fill="#2ECC81" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Absent" fill="#E74C3C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
