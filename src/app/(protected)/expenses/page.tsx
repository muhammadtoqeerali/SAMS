import { ReceiptText, Trash2 } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import { createExpenseAction, deleteExpenseAction } from "@/app/actions";
import { euro, formatDateTime, monthLabel } from "@/lib/format";
import { getExpensesForMonth, getMonthSnapshot } from "@/lib/data";
import { normalizeMonth } from "@/lib/month";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = normalizeMonth((await searchParams).month);
  const [snapshot, expenses] = await Promise.all([getMonthSnapshot(month), getExpensesForMonth(month)]);
  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Shared purchases</span><h1>Expenses</h1><p>Groceries and household items for {monthLabel(month)}.</p></div><MonthPicker month={month} /></header>
      <section className="two-column-form">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New entry</span><h2>Add an expense</h2></div><ReceiptText size={20} /></div>
          <ActionForm action={createExpenseAction} submitLabel="Add expense">
            <label className="field"><span>Paid by</span><select name="paidBy" required defaultValue=""><option value="" disabled>Select resident</option>{snapshot.participants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <label className="field"><span>Item / purchase name</span><input name="title" placeholder="e.g. Weekly groceries" required /></label>
            <div className="field-row">
              <label className="field"><span>Category</span><select name="category" defaultValue="GROCERY"><option value="GROCERY">Grocery</option><option value="HOUSEHOLD">Household</option><option value="OTHER">Other</option></select></label>
              <label className="field"><span>Amount (€)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            </div>
            <label className="field"><span>Description <em>optional</em></span><textarea name="description" rows={3} placeholder="Any useful detail…" /></label>
            <p className="form-hint">The exact date and time are saved automatically when you submit.</p>
          </ActionForm>
        </article>
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">{monthLabel(month)}</span><h2>{euro(snapshot.groceryTotal)} recorded</h2></div><span className="count-badge">{expenses.length} entries</span></div>
          {expenses.length ? <div className="expense-list">{expenses.map((expense) => (
            <div className="expense-item" key={expense.id}>
              <div className="activity-icon"><ReceiptText size={18} /></div>
              <div className="activity-main"><strong>{expense.title}</strong><span>{expense.payerName} · {formatDateTime(expense.purchasedAt)}</span>{expense.description && <p>{expense.description}</p>}</div>
              <div className="expense-side"><strong>{euro(expense.amount)}</strong><span className="tag">{expense.category.toLowerCase()}</span></div>
              <form action={deleteExpenseAction}><input type="hidden" name="id" value={expense.id} /><button className="icon-button danger" title="Delete expense" aria-label="Delete expense"><Trash2 size={16} /></button></form>
            </div>
          ))}</div> : <EmptyState title="No expenses yet" text="Use the form to add the first shared purchase for this month." />}
        </article>
      </section>
    </>
  );
}
