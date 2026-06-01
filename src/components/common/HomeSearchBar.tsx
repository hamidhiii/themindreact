import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BookOpen, FileText, GraduationCap, UserPlus } from 'lucide-react';
import { useGetStudentsQuery } from '../../store/api/studentApi';
import { useGetGroupsQuery } from '../../store/api/groupApi';
import { useGetExamsQuery } from '../../store/api/examApi';
import { useGetLeadsQuery } from '../../store/api/leadApi';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'student' | 'group' | 'exam' | 'lead' | 'teacher';
    href: string;
}

const TYPE_META = {
    student: { icon: Users, color: '#2ECC8A', label: 'Student' },
    group: { icon: BookOpen, color: '#4C6FFF', label: 'Group' },
    exam: { icon: FileText, color: '#9B59B6', label: 'Exam' },
    lead: { icon: UserPlus, color: '#ED6A2E', label: 'Lead' },
    teacher: { icon: GraduationCap, color: '#FF9F0A', label: 'Teacher' },
} as const;

export default function HomeSearchBar({
    placeholder = 'Search students, groups, exams...',
    className = '',
}: {
    placeholder?: string;
    className?: string;
}) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const { data: students = [] } = useGetStudentsQuery();
    const { data: groups = [] } = useGetGroupsQuery();
    const { data: exams = [] } = useGetExamsQuery();
    const { data: leads = [] } = useGetLeadsQuery();
    const { options: teacherOptions } = useTeacherOptions();

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const results = useMemo<SearchResult[]>(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];

        const list: SearchResult[] = [];

        for (const s of students) {
            const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
            const haystack = `${name} ${s.phone ?? ''} ${s.groupName ?? ''}`.toLowerCase();
            if (haystack.includes(q) && s.id != null) {
                list.push({
                    id: `student-${s.id}`,
                    title: name || `Student #${s.id}`,
                    subtitle: [s.phone, s.groupName].filter(Boolean).join(' · ') || undefined,
                    type: 'student',
                    href: `/student-details/${s.id}`,
                });
            }
            if (list.length >= 8) break;
        }

        for (const g of groups) {
            const name = g.name ?? '';
            if (name.toLowerCase().includes(q) && g.id != null) {
                list.push({
                    id: `group-${g.id}`,
                    title: name,
                    subtitle: [g.teacherName, g.levelDisplay ?? g.level].filter(Boolean).join(' · ') || undefined,
                    type: 'group',
                    href: `/groups/details/${g.id}`,
                });
            }
            if (list.length >= 12) break;
        }

        for (const e of exams) {
            const title = e.title ?? '';
            if (title.toLowerCase().includes(q) && e.id != null) {
                list.push({
                    id: `exam-${e.id}`,
                    title,
                    subtitle: e.groupName ?? undefined,
                    type: 'exam',
                    href: `/exams/details/${e.id}`,
                });
            }
            if (list.length >= 16) break;
        }

        for (const l of leads) {
            const name = l.firstName ?? '';
            if (name.toLowerCase().includes(q) && l.id != null) {
                list.push({
                    id: `lead-${l.id}`,
                    title: name,
                    subtitle: [l.phone, l.statusDisplay ?? l.status].filter(Boolean).join(' · ') || undefined,
                    type: 'lead',
                    href: '/active-leads',
                });
            }
            if (list.length >= 18) break;
        }

        for (const t of teacherOptions) {
            if (t.label.toLowerCase().includes(q)) {
                list.push({
                    id: `teacher-${t.value}`,
                    title: t.label,
                    type: 'teacher',
                    href: `/teachers/details/${t.value}`,
                });
            }
            if (list.length >= 20) break;
        }

        return list.slice(0, 20);
    }, [query, students, groups, exams, leads, teacherOptions]);

    const grouped = useMemo(() => {
        const map: Record<string, SearchResult[]> = {};
        for (const r of results) {
            if (!map[r.type]) map[r.type] = [];
            map[r.type].push(r);
        }
        return map;
    }, [results]);

    const handlePick = (href: string) => {
        navigate(href);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={ref} className={`relative ${className || 'flex-1 max-w-[420px]'}`}>
            <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8] pointer-events-none"
            />
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full h-10 bg-[#F5F6FA] border border-transparent rounded-xl pl-11 pr-4 text-[13px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#F37021]/40 focus:bg-white transition-colors"
            />
            {open && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-12 z-50 max-h-[420px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                    {results.length === 0 ? (
                        <div className="px-4 py-6 text-center text-[12px] font-bold uppercase tracking-widest text-[#8A9BB8]">
                            Nothing found
                        </div>
                    ) : (
                        Object.entries(grouped).map(([type, items]) => {
                            const meta = TYPE_META[type as keyof typeof TYPE_META];
                            const Icon = meta.icon;
                            return (
                                <div key={type}>
                                    <div className="sticky top-0 bg-[#F8F9FB] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#8A9BB8] border-b border-[#F0F1F5]">
                                        {meta.label}s · {items.length}
                                    </div>
                                    {items.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => handlePick(r.href)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FB] transition-colors border-b border-[#F0F1F5] last:border-b-0"
                                        >
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${meta.color}1A` }}
                                            >
                                                <Icon size={16} style={{ color: meta.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-extrabold text-[#1A2233] truncate">
                                                    {r.title}
                                                </p>
                                                {r.subtitle && (
                                                    <p className="text-[11px] font-bold text-[#8A9BB8] truncate">
                                                        {r.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
