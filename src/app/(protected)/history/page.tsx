import Link from "next/link";
import { ArrowUpRight, CalendarRange } from "lucide-react";
import { MonthPicker } from "@/components/MonthPicker";
import { euro, monthLabel } from "@/lib/format";
import { getHistory } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export const metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const history = await getHistory(month, 18);
  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Monthly archive</span><h1>History</h1><p>Jump back to any recent month without losing the original records.</p></div><MonthPicker month={month} /></header>
      <section className="card">
        <div className="card-head"><div><span className="eyebrow">Through {monthLabel(month)}</span><h2>Last 18 months</h2></div><CalendarRange size={20} /></div>
        <div className="history-list">
          {history.map((item) => (
            <Link className="history-row" href={`/?month=${item.month}`} key={item.month}>
              <div className="history-month"><strong>{monthLabel(item.month)}</strong><span>{item.month}</span></div>
              <div className="history-metric"><span>Rent</span><strong>{euro(item.rent)}</strong></div>
              <div className="history-metric"><span>Groceries</span><strong>{euro(item.groceries)}</strong></div>
              <div className="history-metric"><span>Utilities</span><strong>{euro(item.utilities)}</strong></div>
              <div className="history-total"><span>Total</span><strong>{euro(item.total)}</strong></div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
