import { Banknote, Car, Coffee, ShoppingCart } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function ExpensesPage() {
  return (
    <UtilityPage
      title="Expenses"
      subtitle="Expense categories and operational cost tracking."
      icon={Banknote}
      metrics={[
        { label: 'Categories', value: 4, tone: '#ED6A2E' },
        { label: 'This month', value: '0 UZS', tone: '#E74C3C' },
        { label: 'Reports', value: 'All', tone: '#6B7FD4' },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { name: 'Groceries', icon: ShoppingCart, color: '#2ECC8A' },
          { name: 'Transport', icon: Car, color: '#6B7FD4' },
          { name: 'Entertainment', icon: Coffee, color: '#ED6A2E' },
          { name: 'General', icon: Banknote, color: '#8A9BB8' },
        ].map((item) => (
          <div key={item.name} className="rounded-[16px] border border-[#F0F1F5] bg-[#F8F9FB] p-4">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}1A`, color: item.color }}>
              <item.icon size={18} />
            </div>
            <p className="text-[13px] font-black text-[#1A2233]">{item.name}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#8A9BB8]">Ready for tracking</p>
          </div>
        ))}
      </div>
    </UtilityPage>
  );
}
