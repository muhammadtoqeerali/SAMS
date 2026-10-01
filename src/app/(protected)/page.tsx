import Link from "next/link";
import { ArrowRight, Building2, Check, CheckCircle2, CreditCard, ReceiptText, RotateCcw, Users, WalletCards, Zap } from "lucide-react";
import { setRentPaymentAction } from "@/app/actions";
import { TrendChart, ContributionChart } from "@/components/AnalyticsCharts";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import { StatCard } from "@/components/StatCard";
import { euro, formatDateTime, monthLabel } from "@/lib/format";
import { getMonthSnapshot, getTrend } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const [snapshot, trend] = await Promise.all([getMonthSnapshot(month), getTrend(month, 12)]);
  return (
    <>
      <header className="page-header hero-header">
        <div>
          <span className="eyebrow">Apartment overview</span>
          <h1>{monthLabel(month)}</h1>
          <p>{snapshot.participants.length} active resident{snapshot.participants.length === 1 ? "" : "s"} · all amounts in EUR</p>
        </div>
        <MonthPicker month={month} />
      </header>

      {snapshot.participants.length === 0 && (
        <div className="notice-banner">
          <Users size={19} />
          <div><strong>No active residents for this month.</strong><span>Add resident profiles before entering shared expenses.</span></div>
          <Link href="/members" className="button secondary compact">Add residents</Link>
        </div>
      )}

      <section className="stats-grid">
        <StatCard label="Household total" value={euro(snapshot.householdTotal)} detail="Rent + shared costs" icon={WalletCards} tone="blue" />
        <StatCard label="Rent" value={euro(snapshot.rentTotal)} detail={`${euro(snapshot.rentResidentPaidTotal)} paid · ${euro(snapshot.rentResidentDueTotal)} due`} icon={Building2} />
        <StatCard label="Groceries & house" value={euro(snapshot.groceryTotal)} detail={`${snapshot.expenses.length} recorded purchase${snapshot.expenses.length === 1 ? "" : "s"}`} icon={ReceiptText} tone="green" />
        <StatCard label="Utilities" value={euro(snapshot.utilityTotal)} detail={`${euro(snapshot.utilityResidentPaidTotal)} cleared · ${euro(snapshot.utilityResidentDueTotal)} due`} icon={Zap} tone="amber" />
      </section>

      <section className="dashboard-grid charts-grid">
        <article className="card span-2">
          <div className="card-head"><div><span className="eyebrow">12-month view</span><h2>Spending trend</h2></div></div>
          <TrendChart data={trend} />
        </article>
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">This month</span><h2>Paid vs fair share</h2></div></div>
          {snapshot.balances.length ? <ContributionChart data={snapshot.balances} /> : <EmptyState title="Nothing to chart yet" text="Resident contributions will appear here." />}
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="card span-2">
          <div className="card-head">
            <div><span className="eyebrow">Resident breakdown</span><h2>Monthly responsibility</h2></div>
            <span className="small-note">Confirm rent here; confirm electricity/water on Utilities.</span>
          </div>
          {snapshot.balances.length ? (
            <div className="table-scroll">
              <table>
                <thead><tr><th>Resident</th><th>Rent</th><th>Rent status</th><th>Groceries</th><th>Utilities</th><th>Utility status</th><th>Shared balance</th><th>Still due</th><th>Total responsibility</th></tr></thead>
                <tbody>{snapshot.balances.map((row) => (
                  <tr key={row.id}>
                    <td><Link className="resident-link" href={`/members/${row.id}`}><strong>{row.name}</strong></Link></td>
                    <td>{euro(row.rent)}</td>
                    <td>
                      <div className="payment-status-stack">
                        <span className={`balance-pill ${row.rentDue > 0.009 ? "negative" : "positive"}`}>{row.rentDue > 0.009 ? `due ${euro(row.rentDue)}` : "clear"}</span>
                        <form action={setRentPaymentAction}>
                          <input type="hidden" name="memberId" value={row.id} />
                          <input type="hidden" name="month" value={month} />
                          <input type="hidden" name="mode" value={row.rentDue > 0.009 ? "paid" : "unpaid"} />
                          <button className={`mini-payment-button ${row.rentDue > 0.009 ? "confirm" : "undo"}`} type="submit">
                            {row.rentDue > 0.009 ? <><Check size={12} /> Mark paid</> : <><RotateCcw size={12} /> Undo</>}
                          </button>
                        </form>
                      </div>
                    </td>
                    <td>{euro(row.groceries)}</td>
                    <td>{euro(row.utilities)}</td>
                    <td><span className={`balance-pill ${row.utilityDue > 0.009 ? "negative" : "positive"}`}>{row.utilityDue > 0.009 ? `due ${euro(row.utilityDue)}` : "clear"}</span></td>
                    <td><span className={`balance-pill ${row.netBalance > 0.009 ? "positive" : row.netBalance < -0.009 ? "negative" : "neutral"}`}>{row.netBalance > 0.009 ? `gets ${euro(row.netBalance)}` : row.netBalance < -0.009 ? `owes ${euro(-row.netBalance)}` : "settled"}</span></td>
                    <td><strong className={row.totalDue > 0.009 ? "due-text" : "clear-text"}>{row.totalDue > 0.009 ? euro(row.totalDue) : "€0 clear"}</strong></td>
                    <td><strong>{euro(row.totalObligation)}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No residents in this month" text="Add or reactivate a resident to calculate shares." />}
        </article>

        <article className="card settlement-card">
          <div className="card-head"><div><span className="eyebrow">Smart settlement</span><h2>Who pays whom</h2></div><CreditCard size={20} /></div>
          {snapshot.settlements.length ? (
            <div className="settlement-list">{snapshot.settlements.map((item, index) => (
              <div className="settlement-row" key={`${item.fromId}-${item.toId}-${index}`}>
                <div><strong>{item.from}</strong><span>pays</span><strong>{item.to}</strong></div><strong className="settlement-amount">{euro(item.amount)}</strong>
              </div>
            ))}</div>
          ) : <EmptyState title="No roommate transfers needed" text="Already-paid shared costs are balanced for this month." />}
          <div className={`utility-due ${snapshot.utilityResidentDueTotal <= 0.009 ? "clear" : ""}`}>
            {snapshot.utilityResidentDueTotal <= 0.009 ? <CheckCircle2 size={17} /> : <Zap size={17} />}
            <div>
              <strong>{snapshot.utilityResidentDueTotal <= 0.009 ? "All utility shares are clear" : `${euro(snapshot.utilityResidentDueTotal)} resident utility shares still due`}</strong>
              <span>{snapshot.utilityResidentDueTotal <= 0.009 ? "Paid records stay saved in this month's utility ledger." : "Open Utilities to confirm each resident when they pay."}</span>
            </div>
          </div>
          {snapshot.rentResidentDueTotal > 0.009 && <div className="utility-unassigned"><span>{euro(snapshot.rentResidentDueTotal)} rent still due this month.</span></div>}
          {snapshot.unpaidUtilityTotal > 0 && <div className="utility-unassigned"><span>{euro(snapshot.unpaidUtilityTotal)} of utility bills have no bill holder assigned.</span></div>}
        </article>
      </section>

      <section className="card">
        <div className="card-head"><div><span className="eyebrow">Latest entries</span><h2>Recent purchases</h2></div><Link href={`/expenses?month=${month}`} className="text-link">View all <ArrowRight size={15} /></Link></div>
        {snapshot.expenses.length ? <div className="activity-list">{snapshot.expenses.slice(0, 6).map((expense) => (
          <div className="activity-row" key={expense.id}><div className="activity-icon"><ReceiptText size={18} /></div><div className="activity-main"><strong>{expense.title}</strong><span>{expense.payerName} · {formatDateTime(expense.purchasedAt)}</span></div><strong>{euro(expense.amount)}</strong></div>
        ))}</div> : <EmptyState title="No purchases this month" text="Add the first grocery or household expense to start the monthly record." />}
      </section>
    </>
  );
}
