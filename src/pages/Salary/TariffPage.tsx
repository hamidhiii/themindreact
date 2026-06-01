import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useGetTariffsQuery, useCreateTariffMutation, useDeleteTariffMutation } from '../../store/api/salaryApi';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../../components/common/modalStyles';
import { useToast } from '../../hooks/useToast';

export default function TariffPage() {
    const { data: tariffs = [], isLoading } = useGetTariffsQuery();
    const [createTariff] = useCreateTariffMutation();
    const [deleteTariff] = useDeleteTariffMutation();
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        price: '',
        durationMonths: 1,
        type: '',
        description: '',
        isActive: true,
        isPopular: false,
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await createTariff(form).unwrap();
        toast.success('Tariff created successfully');
        setShowModal(false);
        setForm({ name: '', price: '', durationMonths: 1, type: '', description: '', isActive: true, isPopular: false });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">Tariffs</h1>
                    <p className="text-text-secondary text-sm">Tariffs for salary calculations</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Add tariff
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tariffs.map(t => (
                        <div key={t.id} className="card flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-text-primary">{t.name}</p>
                                <p className="text-primary text-xl font-bold mt-1">{Number(t.price).toLocaleString()} UZS</p>
                                <p className="text-xs text-text-secondary mt-1">{t.durationLabel ?? `${t.durationMonths} mo.`}</p>
                                {t.type && <p className="text-xs text-text-secondary">{t.type}</p>}
                            </div>
                            <button onClick={async () => {
                                await deleteTariff(t.id!).unwrap();
                                toast.success('Tariff deleted successfully');
                            }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {tariffs.length === 0 && <div className="text-text-secondary text-sm">No tariffs found</div>}
                </div>
            )}

            {showModal && (
                <div className={MODAL_OVERLAY_CLASS}>
                    <div className={`rounded-2xl w-full max-w-md ${MODAL_PANEL_CLASS}`}>
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-bold">Add tariff</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (UZS)</label>
                                    <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (months)</label>
                                    <input type="number" value={form.durationMonths} onChange={e => setForm({ ...form, durationMonths: Number(e.target.value) })} className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost border border-gray-200">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
