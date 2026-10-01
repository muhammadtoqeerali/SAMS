import { Droplets, Trash2, Zap } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import { createUtilityAction, deleteUtilityAction } from "@/app/actions";
import { euro, formatDate, monthLabel } from "@/lib/format";
import { getMonthSnapshot } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export const metadata = { title: "Utilities" };

export default async function UtilitiesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const snapshot = await getMonthSnapshot(month);
  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Electricity & water</span><h1>Utilities</h1><p>Bills are automatically prorated into {monthLabel(month)} by billing-period days.</p></div><MonthPicker month={month} /></header>
      <section className="stats-grid mini-stats">
        <div className="mini-stat"><Zap size={18} /><div><span>Electricity</span><strong>{euro(snapshot.electricityTotal)}</strong></div></div>
        <div className="mini-stat"><Droplets size={18} /><div><span>Water</span><strong>{euro(snapshot.waterTotal)}</strong></div></div>
        <div className="mini-stat"><div className="symbol">÷</div><div><span>Per resident</span><strong>{euro(snapshot.utilityTotal / Math.max(snapshot.participants.length, 1))}</strong></div></div>
      </section>
      <section className="two-column-form">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New bill</span><h2>Add utility bill</h2></div><Zap size={20} /></div>
          <ActionForm action={createUtilityAction} submitLabel="Save utility bill">
            <label className="field"><span>Utility</span><select name="type" defaultValue="ELECTRICITY"><option value="ELECTRICITY">Electricity</option><option value="WATER">Water</option></select></label>
            <div className="field-row"><label className="field"><span>Bill starts</span><input name="billStart" type="date" required /></label><label className="field"><span>Bill ends</span><input name="billEnd" type="date" required /></label></div>
            <label className="field"><span>Total bill amount (€)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            <label className="field"><span>Already paid by <em>optional</em></span><select name="paidBy" defaultValue=""><option value="">Not paid yet / external bill</option>{snapshot.participants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <label className="field"><span>Notes <em>optional</em></span><textarea name="notes" rows={3} placeholder="Meter period, provider, reference…" /></label>
            <p className="form-hint">If a roommate already paid the bill, choose them so SAMS includes it in the roommate settlement.</p>
          </ActionForm>
        </article>
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Bills touching {monthLabel(month)}</span><h2>{euro(snapshot.utilityTotal)} allocated</h2></div><span className="count-badge">{snapshot.bills.length} bills</span></div>
          {snapshot.bills.length ? <div className="expense-list">{snapshot.bills.map((bill) => (
            <div className="expense-item" key={bill.id}>
              <div className={`activity-icon ${bill.type === "WATER" ? "water" : "electric"}`}>{bill.type === "WATER" ? <Droplets size={18} /> : <Zap size={18} />}</div>
              <div className="activity-main"><strong>{bill.type === "WATER" ? "Water" : "Electricity"} bill</strong><span>{formatDate(bill.billStart)} → {formatDate(bill.billEnd)}</span>{bill.notes && <p>{bill.notes}</p>}{bill.payerName && <span className="paid-note">Paid by {bill.payerName}</span>}</div>
              <div className="expense-side"><strong>{euro(bill.allocatedAmount)}</strong><span className="muted-mini">of {euro(bill.amount)}</span></div>
              <form action={deleteUtilityAction}><input type="hidden" name="id" value={bill.id} /><button className="icon-button danger" title="Delete bill" aria-label="Delete bill"><Trash2 size={16} /></button></form>
            </div>
          ))}</div> : <EmptyState title="No utility bills for this month" text="Add a bill with its real start and end dates; SAMS handles the monthly portion." />}
        </article>
      </section>
    </>
  );
}
