import type { ElementType, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface UtilityMetric {
  label: string;
  value: string | number;
  tone?: string;
}

interface UtilityPageProps {
  title: string;
  subtitle: string;
  icon: ElementType;
  metrics?: UtilityMetric[];
  children?: ReactNode;
}

export default function UtilityPage({
  title,
  subtitle,
  icon: Icon,
  metrics = [],
  children,
}: UtilityPageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#1A2233]">
            {title}
          </h1>
          <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
            {subtitle}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#ED6A2E]/10 text-[#ED6A2E]">
          <Icon size={21} />
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[18px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-[#8A9BB8]">
                {metric.label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p
                  className="text-[24px] font-black leading-none text-[#1A2233]"
                  style={{ color: metric.tone }}
                >
                  {metric.value}
                </p>
                <ArrowUpRight size={17} className="text-[#8A9BB8]" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[20px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)] sm:p-6">
        {children}
      </div>
    </div>
  );
}
