import { ClipboardList } from 'lucide-react';
import { useGetExamsQuery } from '../../store/api/examApi';

export default function TeacherExamsPage() {
  const { data: exams = [], isLoading } = useGetExamsQuery();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[24px] font-extrabold text-[#1A2233]">Exams</h1>
        <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
          Exam schedule and pass scores.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-[18px] border border-[#F0F1F5] bg-white py-12 text-center text-[#8A9BB8] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No exams yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-[18px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="font-bold text-[#1A2233]">{exam.title}</h3>
                <span className={exam.isActive ? 'badge-green' : 'badge-gray'}>
                  {exam.isActive ? 'Active' : 'Finished'}
                </span>
              </div>
              <p className="text-[13px] font-semibold text-[#8A9BB8]">
                {exam.examDate} / {exam.startTime} - {exam.endTime}
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#ED6A2E]">
                Pass score: {exam.passScore}
                {exam.isPercentage ? '%' : ' pts'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
