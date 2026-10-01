import Link from "next/link";
import { ArrowLeft, Check, CircleDollarSign, ReceiptText, RotateCcw, WalletCards, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import { setRentPaymentAction } from "@/app/actions";
import { euro, formatDate, formatDateTime, monthLabel } from "@/lib/format";
import { getMemberLedger } from "@/lib/data";
import { currentMonth } from "@/lib/month";

export default async function MemberLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledger = await getMemberLedger(id, currentMonth());
  if (!ledger) notFound();
  const { summary, months } = ledger;
  const member = summary.member;

  return (
    <>
      <header className="page-header member-ledger-header">
        <div>
          <Link href="/members" className="back-link"><ArrowLeft size={15} /> Residents</Link>
          <span className="eyebrow">Lifetime resident ledger</span>
          <h1>{member.name}</h1>
          <p>Living here since {formatDate(member.joinedOn)}{member.leftOn ? ` · left ${formatDate(member.leftOn)}` : " · currently active"}</p>
        </div>
        <span className={`ledger-status-badge ${summary.totalDue > 0.009 ? "due" : "clear"}`}>{summary.totalDue > 0.009 ? `${euro(summary.totalDue)} still due` : "Clear · €0 due"}</span>
      </header>

      <section className="member-lifetime-grid">
        <div className="lifetime-card"><WalletCards size={18} /><span>Total responsibility</span><strong>{euro(summary.totalResponsibility)}</strong><small>{summary.monthsResident} active month{summary.monthsResident === 1 ? "" : "s"}</small></div>
        <div className="lifetime-card"><CircleDollarSign size={18} /><span>Recorded cash paid</span><strong>{euro(summary.recordedCashPaid)}</strong><small>Rent + household purchases + utility payments</small></div>
        <div className={`lifetime-card ${summary.rentDue > 0.009 ? "due" : "clear"}`}><ReceiptText size={18} /><span>Rent</span><strong>{euro(summary.rentPaid)} paid</strong><small>{summary.rentDue > 0.009 ? `${euro(summary.rentDue)} still due` : "All recorded rent clear"}</small></div>
        <div className={`lifetime-card ${summary.utilityDue > 0.009 ? "due" : "clear"}`}><Zap size={18} /><span>Utilities</span><strong>{euro(summary.utilitiesPaid)} cleared</strong><small>{summary.utilityDue > 0.009 ? `${euro(summary.utilityDue)} shares not cleared` : "All utility shares clear"}</small></div>
      </section>

      <section className="dashboard-grid member-breakdown-grid">
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Lifetime charges</span><h2>What {member.name} was responsible for</h2></div></div>
          <div className="ledger-breakdown-list">
            <div><span>Rent charged</span><strong>{euro(summary.rentCharged)}</strong></div>
            <div><span>Groceries / house share</span><strong>{euro(summary.groceriesCharged)}</strong></div>
            <div><span>Utilities share</span><strong>{euro(summary.utilitiesCharged)}</strong></div>
            <div className="total"><span>Total responsibility</span><strong>{euro(summary.totalResponsibility)}</strong></div>
          </div>
        </article>
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Payments & balance</span><h2>What has been recorded</h2></div></div>
          <div className="ledger-breakdown-list">
            <div><span>Rent paid</span><strong>{euro(summary.rentPaid)}</strong></div>
            <div><span>House purchases paid</span><strong>{euro(summary.housePurchasesPaid)}</strong></div>
            <div><span>Utility bills covered as holder</span><strong>{euro(summary.utilityBillsCovered)}</strong></div>
            <div><span>Roommate balance</span><strong>{summary.roommateCredit > 0.009 ? `gets ${euro(summary.roommateCredit)}` : summary.roommateDue > 0.009 ? `owes ${euro(summary.roommateDue)}` : "settled"}</strong></div>
            <div className={`total ${summary.totalDue > 0.009 ? "due" : "clear"}`}><span>Still due overall</span><strong>{euro(summary.totalDue)}</strong></div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-head"><div><span className="eyebrow">Month-by-month record</span><h2>Payment and due history</h2></div><span className="small-note">Rent can be cleared here. Utility shares are cleared on the Utilities page.</span></div>
        <div className="table-scroll">
          <table className="member-ledger-table">
            <thead><tr><th>Month</th><th>Rent</th><th>Rent status</th><th>Groceries</th><th>Utilities</th><th>Utility status</th><th>House paid</th><th>Roommate balance</th><th>Still due</th><th>Monthly status</th></tr></thead>
            <tbody>{months.map((row) => (
              <tr key={row.month}>
                <td><strong>{monthLabel(row.month)}</strong></td>
                <td>{euro(row.rent)}</td>
                <td>
                  <div className="payment-status-stack">
                    <span className={`balance-pill ${row.rentDue > 0.009 ? "negative" : "positive"}`}>{row.rentDue > 0.009 ? `due ${euro(row.rentDue)}` : "clear"}</span>
                    {row.rentPaidAt && <small className="payment-time">{formatDateTime(row.rentPaidAt)}</small>}
                    <form action={setRentPaymentAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="month" value={row.month} />
                      <input type="hidden" name="mode" value={row.rentDue > 0.009 ? "paid" : "unpaid"} />
                      <button className={`mini-payment-button ${row.rentDue > 0.009 ? "confirm" : "undo"}`} type="submit">{row.rentDue > 0.009 ? <><Check size={12} /> Mark paid</> : <><RotateCcw size={12} /> Undo</>}</button>
                    </form>
                  </div>
                </td>
                <td>{euro(row.groceries)}</td>
                <td>{euro(row.utilities)}</td>
                <td><div className="payment-status-stack"><span className={`balance-pill ${row.utilityDue > 0.009 ? "negative" : "positive"}`}>{row.utilityDue > 0.009 ? `due ${euro(row.utilityDue)}` : "clear"}</span><Link className="mini-ledger-link" href={`/utilities?month=${row.month}`}>Open utilities</Link></div></td>
                <td>{euro(row.paidForHouse)}</td>
                <td><span className={`balance-pill ${row.roommateBalance > 0.009 ? "positive" : row.roommateBalance < -0.009 ? "negative" : "neutral"}`}>{row.roommateBalance > 0.009 ? `gets ${euro(row.roommateBalance)}` : row.roommateBalance < -0.009 ? `owes ${euro(-row.roommateBalance)}` : "settled"}</span></td>
                <td><strong className={row.totalDue > 0.009 ? "due-text" : "clear-text"}>{euro(row.totalDue)}</strong></td>
                <td><span className={`ledger-month-status ${row.totalDue > 0.009 ? "due" : "clear"}`}>{row.totalDue > 0.009 ? "Open" : "Clear"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!months.length && <p className="form-hint">No active months have been recorded for this resident yet.</p>}
      </section>
    </>
  );
}
