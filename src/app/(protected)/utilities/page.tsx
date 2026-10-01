import { Check, Droplets, RotateCcw, Trash2, Users, Zap } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import { createUtilityAction, deleteUtilityAction, setUtilitySharePaymentAction } from "@/app/actions";
import { countryBadge } from "@/lib/country";
import { euro, formatDate, formatDateTime, monthLabel } from "@/lib/format";
import { getMonthSnapshot } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export const metadata = { title: "Utilities" };

export default async function UtilitiesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const snapshot = await getMonthSnapshot(month);
  const fullBillTotal = snapshot.bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Electricity & water</span>
          <h1>Utilities</h1>
          <p>See the original bill, the amount belonging to {monthLabel(month)}, each resident&apos;s exact share, and who has paid.</p>
        </div>
        <MonthPicker month={month} />
      </header>

      <section className="utility-overview-grid">
        <div className="utility-overview-card"><div className="utility-overview-icon electric"><Zap size={18} /></div><div><span>Full bills shown</span><strong>{euro(fullBillTotal)}</strong><small>{snapshot.bills.length} bill{snapshot.bills.length === 1 ? "" : "s"} touching this month</small></div></div>
        <div className="utility-overview-card"><div className="utility-overview-icon month">€</div><div><span>{monthLabel(month)} portion</span><strong>{euro(snapshot.utilityTotal)}</strong><small>{euro(snapshot.electricityTotal)} electricity · {euro(snapshot.waterTotal)} water</small></div></div>
        <div className="utility-overview-card due"><div className="utility-overview-icon">!</div><div><span>Still due from residents</span><strong>{euro(snapshot.utilityResidentDueTotal)}</strong><small>Exact unpaid shares for this month</small></div></div>
        <div className="utility-overview-card clear"><div className="utility-overview-icon"><Check size={18} /></div><div><span>Confirmed paid</span><strong>{euro(snapshot.utilityResidentPaidTotal)}</strong><small>Saved permanently in the monthly ledger</small></div></div>
      </section>

      <section className="two-column-form">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New bill</span><h2>Add utility bill</h2></div><Zap size={20} /></div>
          <ActionForm action={createUtilityAction} submitLabel="Save utility bill">
            <label className="field"><span>Utility</span><select name="type" defaultValue="ELECTRICITY"><option value="ELECTRICITY">Electricity</option><option value="WATER">Water</option></select></label>
            <div className="field-row"><label className="field"><span>Bill starts</span><input name="billStart" type="date" required /></label><label className="field"><span>Bill ends</span><input name="billEnd" type="date" required /></label></div>
            <label className="field"><span>Total bill amount (€)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            <label className="field">
              <span>Bill holder / person collecting shares <em>optional</em></span>
              <select name="paidBy" defaultValue="">
                <option value="">No specific holder</option>
                {snapshot.participants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Notes <em>optional</em></span><textarea name="notes" rows={3} placeholder="Provider, meter period, reference…" /></label>
            <div className="utility-form-note">
              <strong>How payment works</strong>
              <span>The bill holder does not become automatically “paid”. Every resident, including the holder, has their own share below. Confirm a person only after their share is actually settled.</span>
            </div>
          </ActionForm>
        </article>

        <article className="card utility-ledger-card">
          <div className="card-head">
            <div><span className="eyebrow">Bill ledger · {monthLabel(month)}</span><h2>{euro(snapshot.utilityResidentDueTotal)} currently outstanding</h2></div>
            <span className="count-badge">{snapshot.bills.length} bills</span>
          </div>

          {snapshot.bills.length ? (
            <div className="utility-bill-list">
              {snapshot.bills.map((bill) => {
                const allClear = bill.shares.length > 0 && bill.residentDueTotal <= 0.009;
                const averageShare = bill.shares.length ? bill.allocatedAmount / bill.shares.length : 0;
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
                      <form action={deleteUtilityAction}>
                        <input type="hidden" name="id" value={bill.id} />
                        <button className="icon-button danger" title="Delete bill" aria-label="Delete bill"><Trash2 size={16} /></button>
                      </form>
                    </div>

                    <div className="utility-bill-metrics">
                      <div><span>Full bill</span><strong>{euro(bill.amount)}</strong></div>
                      <div><span>This month</span><strong>{euro(bill.allocatedAmount)}</strong></div>
                      <div><span>Residents</span><strong>{bill.shares.length}</strong></div>
                      <div><span>Average share</span><strong>{euro(averageShare)}</strong></div>
                      <div className="paid"><span>Paid</span><strong>{euro(bill.residentPaidTotal)}</strong></div>
                      <div className={bill.residentDueTotal > 0.009 ? "due" : "paid"}><span>Still due</span><strong>{euro(bill.residentDueTotal)}</strong></div>
                    </div>

                    <div className={`utility-ledger-summary ${allClear ? "clear" : "due"}`}>
                      <div>
                        <strong>{allClear ? "All residents clear · €0 due" : `${euro(bill.residentDueTotal)} remains unpaid`}</strong>
                        <span>{bill.clearedResidents} of {bill.shares.length} resident{bill.shares.length === 1 ? "" : "s"} cleared for {monthLabel(month)}</span>
                      </div>
                      <span>{euro(bill.residentPaidTotal)} confirmed</span>
                    </div>

                    {bill.shares.length ? (
                      <div className="utility-share-list">
                        {bill.shares.map((share) => {
                          const country = countryBadge(share.nationality);
                          return (
                            <div className={`utility-share-row ${share.isPaid ? "is-paid" : "is-due"}`} key={share.memberId}>
                              <div className="utility-share-person">
                                <div className="resident-name-with-flag"><span className="mini-flag" title={country.label}>{country.flag}</span><strong>{share.memberName}</strong></div>
                                <span>Exact share {euro(share.share)}</span>
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
                                    <small>{bill.payerName ? `Pay/settle with ${bill.payerName}` : "Not cleared yet"}</small>
                                  </>
                                )}
                              </div>
                              <form action={setUtilitySharePaymentAction}>
                                <input type="hidden" name="billId" value={bill.id} />
                                <input type="hidden" name="memberId" value={share.memberId} />
                                <input type="hidden" name="month" value={month} />
                                <input type="hidden" name="mode" value={share.isPaid ? "unpaid" : "paid"} />
                                <input type="hidden" name="returnTo" value={`/utilities?month=${month}`} />
                                <button className={`utility-payment-button ${share.isPaid ? "undo" : "confirm"}`} type="submit">
                                  {share.isPaid ? <><RotateCcw size={14} /> Undo</> : <><Check size={14} /> Mark paid</>}
                                </button>
                              </form>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-utility-residents"><Users size={17} /><span>No active residents exist for this month, so shares cannot be calculated.</span></div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No utility bills for this month" text="Add a bill with its real start/end dates. SAMS will show the full bill, prorate the selected month, and split it among active residents." />
          )}
        </article>
      </section>
    </>
  );
}
