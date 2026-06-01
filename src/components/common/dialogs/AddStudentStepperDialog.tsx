import { useState, Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    X, UserPlus2, Check, ArrowRight, ArrowLeft, Phone, MessageCircle,
    Cake, User as MaleIcon, UserCircle as FemaleIcon, Globe, Users,
    Wallet, Banknote, CreditCard, Landmark, BookOpen, Printer,
    Instagram, Send, Youtube, Megaphone, MoreHorizontal,
} from 'lucide-react';
import { useCreateStudentMutation, useAssignGroupToStudentMutation } from '../../../store/api/studentApi';
import { useGetGroupsQuery } from '../../../store/api/groupApi';
import { useCreatePaymentMutation } from '../../../store/api/transactionApi';
import { useGetTariffsQuery } from '../../../store/api/salaryApi';
import { useGetBooksQuery } from '../../../store/api/mainTheMindApi';
import { formatApiError } from '../../../utils/apiError';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import { useToast } from '../../../hooks/useToast';
import CustomSelect from '../CustomSelect';

type StepId = 1 | 2 | 3;
type Gender = 'male' | 'female' | '';
type PayMethod = 'cash' | 'card' | 'transfer';

interface FormState {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: Gender;
    source: string;
    phone: string;
    additionalPhone: string;
    telegramUsername: string;
    groupId: string;
    enrollmentPayment: boolean;
    payMethod: PayMethod;
    tariffId: string;
    bookProvided: boolean;
    bookId: string;
    printReceipt: boolean;
}

const SOURCES = [
    { value: 'instagram', label: 'Instagram', Icon: Instagram, color: '#E1306C' },
    { value: 'telegram', label: 'Telegram', Icon: Send, color: '#229ED9' },
    { value: 'youtube', label: 'YouTube', Icon: Youtube, color: '#FF0000' },
    { value: 'walk_in', label: 'Friends', Icon: Users, color: '#4C6FFF' },
    { value: 'reference', label: 'Advertising', Icon: Megaphone, color: '#F37021' },
    { value: 'other', label: 'Other', Icon: MoreHorizontal, color: '#8A9BB8' },
];

const PAY_METHODS: { value: PayMethod; label: string; icon: LucideIcon; color: string }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote, color: '#F37021' },
    { value: 'card', label: 'Card', icon: CreditCard, color: '#4C6FFF' },
    { value: 'transfer', label: 'Transfer', icon: Landmark, color: '#9B59B6' },
];

const STEPS = [
    { id: 1 as StepId, label: 'Personal' },
    { id: 2 as StepId, label: 'Contact' },
    { id: 3 as StepId, label: 'Group' },
];

export default function AddStudentStepperDialog({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<StepId>(1);
    const [createStudent, { isLoading: creatingStudent }] = useCreateStudentMutation();
    const [assignGroup, { isLoading: assigningGroup }] = useAssignGroupToStudentMutation();
    const [createPayment, { isLoading: creatingPayment }] = useCreatePaymentMutation();
    const { data: groups = [] } = useGetGroupsQuery();
    const { data: tariffs = [] } = useGetTariffsQuery();
    const { data: books = [] } = useGetBooksQuery();

    const [form, setForm] = useState<FormState>({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        source: '',
        phone: '',
        additionalPhone: '',
        telegramUsername: '',
        groupId: '',
        enrollmentPayment: false,
        payMethod: 'cash',
        tariffId: '',
        bookProvided: false,
        bookId: '',
        printReceipt: false,
    });
    const [error, setError] = useState('');
    const toast = useToast();

    const canGoNext1 = !!form.firstName.trim() && !!form.lastName.trim() && !!form.birthDate && !!form.gender;
    const canGoNext2 = !!form.phone.trim();

    const handleNext = () => {
        if (step === 1 && canGoNext1) setStep(2);
        else if (step === 2 && canGoNext2) setStep(3);
    };

    const handleBack = () => {
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    const isLoading = creatingStudent || creatingPayment || assigningGroup;

    const handleSubmit = async () => {
        setError('');
        try {
            const created = await createStudent({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                birthDate: form.birthDate,
                gender: form.gender || undefined,
                source: form.source || undefined,
                phone: form.phone.trim(),
                parentPhone: form.additionalPhone.trim() || undefined,
                status: 'active',
                groupId: form.groupId || undefined,
            }).unwrap();

            if (created?.id == null) {
                throw new Error('Student was created but the server did not return an id.');
            }

            if (form.groupId) {
                try {
                    await assignGroup({
                        studentId: created.id,
                        groupId: Number(form.groupId),
                    }).unwrap();
                } catch {
                    // group may already be set via create payload
                }
            }

            if (form.enrollmentPayment) {
                const tariff = tariffs.find((t) => String(t.id) === form.tariffId);
                const amount = tariff?.price ?? '0';
                if (Number(amount) > 0) {
                    try {
                        await createPayment({
                            studentId: created.id,
                            amount: String(amount),
                            payWith: form.payMethod,
                            groupId: form.groupId || undefined,
                        }).unwrap();
                    } catch (paymentErr) {
                        setError(`Student saved, but payment failed: ${formatApiError(paymentErr)}`);
                        return;
                    }
                }
            }

            toast.success('Student created successfully');
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not create student.'));
            toast.error(formatApiError(err, 'Could not create student.'));
        }
    };

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className={MODAL_OVERLAY_CLASS}>
            <div className={`w-full max-w-lg rounded-3xl ${MODAL_PANEL_CLASS} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F37021]/10 flex items-center justify-center">
                            <UserPlus2 size={18} className="text-[#F37021]" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-extrabold text-[#1A2233] leading-tight">New Student</h2>
                            <p className="text-[10px] font-semibold text-[#8A9BB8] mt-0.5">Fill in the details</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-gray-50 hover:text-[#1A2233] transition-colors"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-5 pb-4 shrink-0">
                    <Stepper step={step} />
                </div>

                {error && (
                    <div className="mx-5 mb-2 rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}

                {/* Body */}
                <div className="px-5 flex-1 overflow-y-auto min-h-0 pb-2">
                    {step === 1 && <Step1 form={form} update={update} />}
                    {step === 2 && <Step2 form={form} update={update} />}
                    {step === 3 && (
                        <Step3
                            form={form}
                            update={update}
                            groups={groups}
                            tariffs={tariffs}
                            books={books}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-t border-[#F0F1F5] shrink-0">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold text-[#8A9BB8] hover:bg-gray-50 transition-colors shrink-0"
                        >
                            <ArrowLeft size={13} /> Back
                        </button>
                    ) : (
                        <span className="w-[72px] shrink-0" aria-hidden />
                    )}

                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-3 py-2 text-[11px] font-bold text-[#8A9BB8] hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={step === 1 ? !canGoNext1 : !canGoNext2}
                                className="flex items-center gap-1 rounded-xl bg-[#F37021] px-4 py-2 text-[11px] font-black text-white hover:bg-[#E0651A] disabled:opacity-50 transition-all"
                            >
                                Next <ArrowRight size={13} strokeWidth={3} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex items-center gap-1 rounded-xl bg-[#F37021] px-4 py-2 text-[11px] font-black text-white hover:bg-[#E0651A] disabled:opacity-50 transition-all"
                            >
                                <Check size={13} strokeWidth={3} />
                                {isLoading ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stepper({ step }: { step: StepId }) {
    return (
        <div className="flex items-start w-full">
            {STEPS.map((s, i) => {
                const isDone = s.id < step;
                const isActive = s.id === step;
                const circleBg = isDone ? '#2ECC8A' : isActive ? '#F37021' : '#F0F1F5';
                const circleColor = isDone || isActive ? '#fff' : '#8A9BB8';
                const labelColor = isActive ? '#F37021' : isDone ? '#2ECC8A' : '#8A9BB8';
                const lineDone = i > 0 && step > STEPS[i - 1].id;

                return (
                    <Fragment key={s.id}>
                        {i > 0 && (
                            <div
                                className="flex-1 h-[2px] mt-[17px] min-w-[12px] transition-colors duration-200"
                                style={{ backgroundColor: lineDone ? '#2ECC8A' : '#F0F1F5' }}
                            />
                        )}
                        <div className="flex flex-col items-center shrink-0 w-[76px]">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black transition-all"
                                style={{ backgroundColor: circleBg, color: circleColor }}
                            >
                                {isDone ? <Check size={14} strokeWidth={3} /> : s.id}
                            </div>
                            <span
                                className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-center leading-none"
                                style={{ color: labelColor }}
                            >
                                {s.label}
                            </span>
                        </div>
                    </Fragment>
                );
            })}
        </div>
    );
}

function Step1({
    form,
    update,
}: {
    form: FormState;
    update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
    return (
        <div className="space-y-3">
            <SectionLabel>Personal Information</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
                <InputBox
                    icon={UserPlus2}
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                />
                <InputBox
                    icon={UserPlus2}
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <InputBox
                    icon={Cake}
                    placeholder="Date of Birth"
                    type="date"
                    value={form.birthDate}
                    onChange={(v) => update('birthDate', v)}
                />
                <GenderButton
                    icon={MaleIcon}
                    label="Male"
                    active={form.gender === 'male'}
                    onClick={() => update('gender', 'male')}
                />
                <GenderButton
                    icon={FemaleIcon}
                    label="Female"
                    active={form.gender === 'female'}
                    onClick={() => update('gender', 'female')}
                />
            </div>
            <SourceSelect value={form.source} onChange={(v) => update('source', v)} />
        </div>
    );
}

function Step2({
    form,
    update,
}: {
    form: FormState;
    update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const initial = fullName[0]?.toUpperCase() ?? 'S';

    return (
        <div className="space-y-3">
            <SectionLabel>Contact Information</SectionLabel>
            <InputBox
                icon={Phone}
                placeholder="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(v) => update('phone', v)}
            />
            <InputBox
                icon={Phone}
                placeholder="Additional Phone (optional)"
                type="tel"
                value={form.additionalPhone}
                onChange={(v) => update('additionalPhone', v)}
            />
            <InputBox
                icon={MessageCircle}
                iconColor="#229ED9"
                placeholder="Telegram username (optional)"
                value={form.telegramUsername}
                onChange={(v) => update('telegramUsername', v)}
            />

            {fullName && (
                <div className="rounded-xl border border-[#F37021]/20 bg-[#FFF5F0] p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F37021]/15 flex items-center justify-center shrink-0">
                        <span className="text-[#F37021] text-[11px] font-black uppercase">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-extrabold text-[#1A2233] truncate">{fullName}</p>
                        <p className="text-[9px] font-semibold text-[#8A9BB8] mt-0.5 capitalize">
                            {form.birthDate || '—'}{form.gender ? ` · ${form.gender}` : ''}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Step3({
    form,
    update,
    groups,
    tariffs,
    books,
}: {
    form: FormState;
    update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    groups: Array<{ id?: number; name?: string; teacherName?: string }>;
    tariffs: Array<{ id?: number; name?: string; price?: string }>;
    books: Array<{ id?: number; name?: string; title?: string }>;
}) {
    const fullName = `${form.firstName} ${form.lastName}`.trim();

    return (
        <div className="space-y-3 pb-2">
            <SectionLabel>Assign to Group</SectionLabel>

            <div className="relative">
                <CustomSelect
                    value={form.groupId}
                    onChange={(v) => update('groupId', v)}
                    options={groups.map((g) => ({
                        value: String(g.id),
                        label: `${g.name}${g.teacherName ? ` · ${g.teacherName}` : ''}`,
                    }))}
                    placeholder="Group (optional)"
                    leftIcon={<Users size={14} />}
                    size="sm"
                />
            </div>

            <div
                className={`rounded-xl border p-3.5 transition-all ${
                    form.enrollmentPayment
                        ? 'border-[#F37021]/30 bg-[#FFF5F0]/50'
                        : 'border-[#F0F1F5] bg-[#F8F9FB]'
                }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Wallet
                            size={16}
                            className={`shrink-0 ${form.enrollmentPayment ? 'text-[#F37021]' : 'text-[#8A9BB8]'}`}
                        />
                        <span className="text-[12px] font-extrabold text-[#1A2233]">Enrollment Payment</span>
                    </div>
                    <Toggle
                        checked={form.enrollmentPayment}
                        onChange={(v) => update('enrollmentPayment', v)}
                    />
                </div>

                {form.enrollmentPayment && (
                    <div className="mt-3.5 space-y-3.5 pt-0.5">
                        <div>
                            <FieldLabel>Payment method</FieldLabel>
                            <div className="grid grid-cols-3 gap-2">
                                {PAY_METHODS.map((m) => {
                                    const Icon = m.icon;
                                    const active = form.payMethod === m.value;
                                    return (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => update('payMethod', m.value)}
                                            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wide transition-all"
                                            style={{
                                                backgroundColor: active ? m.color : '#fff',
                                                borderColor: active ? m.color : '#F0F1F5',
                                                color: active ? '#fff' : '#8A9BB8',
                                            }}
                                        >
                                            <Icon size={16} />
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <FieldLabel>Payment plan</FieldLabel>
                            <CustomSelect
                                value={form.tariffId}
                                onChange={(v) => update('tariffId', v)}
                                options={tariffs.map((t) => ({
                                    value: String(t.id),
                                    label: `${t.name}${t.price ? ` · ${Number(t.price).toLocaleString()} UZS` : ''}`,
                                }))}
                                placeholder={tariffs.length === 0 ? 'No tariff available' : 'Select tariff'}
                                disabled={tariffs.length === 0}
                                size="sm"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-bold text-[#1A2233]">Book provided</span>
                            <button
                                type="button"
                                onClick={() => update('bookProvided', !form.bookProvided)}
                                aria-label="Toggle book provided"
                                className="shrink-0"
                            >
                                <CheckBox checked={form.bookProvided} />
                            </button>
                        </div>

                        {form.bookProvided && (
                            <CustomSelect
                                value={form.bookId}
                                onChange={(v) => update('bookId', v)}
                                options={books.map((b) => ({
                                    value: String(b.id),
                                    label: String(b.name ?? b.title ?? 'Book'),
                                }))}
                                placeholder={books.length === 0 ? 'No book available' : 'Select book'}
                                leftIcon={<BookOpen size={14} />}
                                disabled={books.length === 0}
                                size="sm"
                            />
                        )}

                        <div
                            className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 transition-all ${
                                form.printReceipt
                                    ? 'border-[#F37021]/40 bg-[#FFF5F0]/60'
                                    : 'border-[#F0F1F5] bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Printer
                                    size={14}
                                    className={`shrink-0 ${form.printReceipt ? 'text-[#F37021]' : 'text-[#8A9BB8]'}`}
                                />
                                <span
                                    className={`text-[11px] font-bold ${
                                        form.printReceipt ? 'text-[#F37021]' : 'text-[#1A2233]'
                                    }`}
                                >
                                    Print receipt
                                </span>
                            </div>
                            <Toggle
                                checked={form.printReceipt}
                                onChange={(v) => update('printReceipt', v)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {fullName && (
                <div className="rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] p-3 space-y-2">
                    <PreviewRow icon={UserPlus2} label="Name" value={fullName} />
                    <PreviewRow icon={Phone} label="Phone" value={form.phone || '—'} />
                </div>
            )}
        </div>
    );
}

function PreviewRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <Icon size={12} className="text-[#8A9BB8] shrink-0" />
                <span className="text-[10px] font-bold text-[#8A9BB8]">{label}</span>
            </div>
            <span className="text-[11px] font-extrabold text-[#1A2233] truncate">{value}</span>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                checked ? 'bg-[#F37021]' : 'bg-[#9CA3AF]'
            }`}
        >
            <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

function CheckBox({ checked }: { checked: boolean }) {
    return (
        <div
            className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-colors ${
                checked ? 'bg-[#F37021] border-[#F37021]' : 'bg-white border-[#D1D5DB]'
            }`}
        >
            {checked && <Check size={11} strokeWidth={3} className="text-white" />}
        </div>
    );
}

function InputBox({
    icon: Icon,
    placeholder,
    value,
    onChange,
    type = 'text',
    iconColor,
}: {
    icon: LucideIcon;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    iconColor?: string;
}) {
    return (
        <div className="relative">
            <Icon
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: iconColor ?? '#8A9BB8' }}
            />
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputClass}
            />
        </div>
    );
}

function GenderButton({
    icon: Icon,
    label,
    active,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-[11px] font-bold transition-all ${
                active
                    ? 'border-[#F37021] bg-[#FFF5F0] text-[#F37021]'
                    : 'border-[#F0F1F5] bg-[#F8F9FB] text-[#8A9BB8] hover:border-gray-200'
            }`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

function SourceSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <CustomSelect
            value={value}
            onChange={onChange}
            placeholder="Source"
            leftIcon={<Globe size={14} />}
            size="sm"
            options={SOURCES.map((s) => ({
                value: s.value,
                label: s.label,
                icon: <s.Icon size={14} style={{ color: s.color }} />,
            }))}
        />
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[8px] font-black uppercase tracking-widest text-[#8A9BB8] px-0.5 mb-0.5">
            {children}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[8px] font-black uppercase tracking-widest text-[#8A9BB8] px-0.5 mb-1.5">
            {children}
        </div>
    );
}

const inputClass =
    'w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-10 pr-3.5 py-2.5 text-[11px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#F37021]/50 focus:bg-white transition-colors';
