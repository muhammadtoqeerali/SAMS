import { Check, Droplets, RotateCcw, Trash2, Zap } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import { createUtilityAction, deleteUtilityAction, setUtilitySharePaymentAction } from "@/app/actions";
import { euro, formatDate, formatDateTime, monthLabel } from "@/lib/format";
import { getMonthSnapshot } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export const metadata = { title: "Utilities" };

export default async function UtilitiesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const snapshot = await getMonthSnapshot(month);

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Electricity & water</span>
          <h1>Utilities</h1>
          <p>Bills are prorated into {monthLabel(month)} and every resident&apos;s share can be cleared individually.</p>
        </div>
        <MonthPicker month={month} />
      </header>

      <section className="stats-grid mini-stats utility-stats">
        <div className="mini-stat"><Zap size={18} /><div><span>Electricity</span><strong>{euro(snapshot.electricityTotal)}</strong></div></div>
        <div className="mini-stat"><Droplets size={18} /><div><span>Water</span><strong>{euro(snapshot.waterTotal)}</strong></div></div>
        <div className="mini-stat due-stat"><div className="symbol">!</div><div><span>Resident shares due</span><strong>{euro(snapshot.utilityResidentDueTotal)}</strong></div></div>
        <div className="mini-stat clear-stat"><Check size={18} /><div><span>Resident shares cleared</span><strong>{euro(snapshot.utilityResidentPaidTotal)}</strong></div></div>
      </section>

      <section className="two-column-form">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New bill</span><h2>Add utility bill</h2></div><Zap size={20} /></div>
          <ActionForm action={createUtilityAction} submitLabel="Save utility bill">
            <label className="field"><span>Utility</span><select name="type" defaultValue="ELECTRICITY"><option value="ELECTRICITY">Electricity</option><option value="WATER">Water</option></select></label>
            <div className="field-row"><label className="field"><span>Bill starts</span><input name="billStart" type="date" required /></label><label className="field"><span>Bill ends</span><input name="billEnd" type="date" required /></label></div>
            <label className="field"><span>Total bill amount (€)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            <label className="field">
              <span>Bill holder / collects payments <em>optional</em></span>
              <select name="paidBy" defaultValue="">
                <option value="">No specific holder</option>
                {snapshot.participants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Notes <em>optional</em></span><textarea name="notes" rows={3} placeholder="Meter period, provider, reference…" /></label>
            <p className="form-hint">Choose the resident whose name/account the bill is under or who collects everyone&apos;s shares. This does not mark anybody as paid; each resident is cleared separately below.</p>
          </ActionForm>
        </article>

        <article className="card">
          <div className="card-head">
            <div><span className="eyebrow">Bills touching {monthLabel(month)}</span><h2>{euro(snapshot.utilityTotal)} allocated</h2></div>
            <span className="count-badge">{snapshot.bills.length} bills</span>
          </div>

          {snapshot.bills.length ? (
            <div className="utility-bill-list">
              {snapshot.bills.map((bill) => {
                const allClear = bill.shares.length > 0 && bill.residentDueTotal <= 0.009;
                return (
                  <section className={`utility-bill-card ${allClear ? "is-clear" : ""}`} key={bill.id}>
                    <div className="utility-bill-head">
                      <div className={`activity-icon ${bill.type === "WATER" ? "water" : "electric"}`}>
                        {bill.type === "WATER" ? <Droplets size={18} /> : <Zap size={18} />}
                      </div>
                      <div className="activity-main">
                        <strong>{bill.type === "WATER" ? "Water" : "Electricity"} bill</strong>
                        <span>{formatDate(bill.billStart)} → {formatDate(bill.billEnd)}</span>
                        {bill.payerName && <span className="bill-holder">Bill holder: {bill.payerName}</span>}
                        {bill.notes && <p>{bill.notes}</p>}
                      </div>
                      <div className="expense-side">
                        <strong>{euro(bill.allocatedAmount)}</strong>
                        <span className="muted-mini">of {euro(bill.amount)} total bill</span>
                      </div>
                      <form action={deleteUtilityAction}>
                        <input type="hidden" name="id" value={bill.id} />
                        <button className="icon-button danger" title="Delete bill" aria-label="Delete bill"><Trash2 size={16} /></button>
                      </form>
                    </div>

                    <div className={`utility-ledger-summary ${allClear ? "clear" : "due"}`}>
                      <div>
                        <strong>{allClear ? "All residents clear · €0 due" : `${euro(bill.residentDueTotal)} still due`}</strong>
                        <span>{bill.clearedResidents} of {bill.shares.length} resident{bill.shares.length === 1 ? "" : "s"} cleared for {monthLabel(month)}</span>
                      </div>
                      <span>{euro(bill.residentPaidTotal)} cleared</span>
                    </div>

                    {bill.shares.length ? (
                      <div className="utility-share-list">
                        {bill.shares.map((share) => (
                          <div className={`utility-share-row ${share.isPaid ? "is-paid" : "is-due"}`} key={share.memberId}>
                            <div className="utility-share-person">
                              <strong>{share.memberName}</strong>
                              <span>Monthly share {euro(share.share)}</span>
                            </div>
                            <div className="utility-share-state">
                              {share.isPaid ? (
                                <>
                                  <span className="balance-pill positive">Clear · €0 due</span>
                                  {share.paidAt && <small>Confirmed {formatDateTime(share.paidAt)}</small>}
                                </>
                              ) : (
                                <>
                                  <span className="balance-pill negative">Due {euro(share.dueAmount)}</span>
                                  <small>Not cleared yet</small>
                                </>
                              )}
                            </div>
                            <form action={setUtilitySharePaymentAction}>
                              <input type="hidden" name="billId" value={bill.id} />
                              <input type="hidden" name="memberId" value={share.memberId} />
                              <input type="hidden" name="month" value={month} />
                              <input type="hidden" name="mode" value={share.isPaid ? "unpaid" : "paid"} />
                              <button className={`utility-payment-button ${share.isPaid ? "undo" : "confirm"}`} type="submit">
                                {share.isPaid ? <><RotateCcw size={14} /> Undo</> : <><Check size={14} /> Mark paid</>}
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="form-hint">No active residents exist for this month, so no shares can be calculated.</p>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No utility bills for this month" text="Add a bill with its real start and end dates; SAMS handles the monthly portion." />
          )}
        </article>
      </section>
    </>
  );
}
