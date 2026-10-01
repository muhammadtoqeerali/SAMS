import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, Globe2, Phone, UserPlus, Users, WalletCards } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { createMemberAction, setMemberStatusAction } from "@/app/actions";
import { euro, formatDate } from "@/lib/format";
import { getMemberOverviews } from "@/lib/data";
import { currentMonth } from "@/lib/month";

export const metadata = { title: "Residents" };

export default async function MembersPage() {
  const overviews = await getMemberOverviews(currentMonth());
  const today = new Date().toISOString().slice(0, 10);
  const activeCount = overviews.filter((item) => !item.member.leftOn).length;
  const totalDue = overviews.reduce((sum, item) => sum + item.totalDue, 0);
  const totalRecordedPaid = overviews.reduce((sum, item) => sum + item.recordedCashPaid, 0);

  return (
    <>
      <header className="page-header">
        <div><span className="eyebrow">Household profiles & lifetime ledger</span><h1>Residents</h1><p>See each person from their join date: responsibility, recorded payments, and what is still due.</p></div>
        <div className="header-count"><Users size={18} /> {activeCount} current</div>
      </header>

      <section className="member-overview-stats">
        <div className="member-overview-stat"><Users size={18} /><div><span>Resident profiles</span><strong>{overviews.length}</strong></div></div>
        <div className="member-overview-stat"><WalletCards size={18} /><div><span>Recorded cash paid</span><strong>{euro(totalRecordedPaid)}</strong></div></div>
        <div className={`member-overview-stat ${totalDue > 0.009 ? "due" : "clear"}`}><CircleDollarSign size={18} /><div><span>Combined still due</span><strong>{euro(totalDue)}</strong></div></div>
      </section>

      <section className="two-column-form members-layout">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New profile</span><h2>Add resident</h2></div><UserPlus size={20} /></div>
          <ActionForm action={createMemberAction} submitLabel="Create resident profile">
            <label className="field"><span>Full name</span><input name="name" placeholder="Resident name" required /></label>
            <label className="field"><span>Nationality</span><input name="nationality" placeholder="e.g. Pakistani, Italian" required /></label>
            <label className="field"><span>Phone number</span><input name="phone" type="tel" placeholder="+39 …" required /></label>
            <label className="field"><span>Living here since</span><input name="joinedOn" type="date" defaultValue={today} required /></label>
            <p className="form-hint">A move-out date archives the resident without deleting rent, utility, expense or payment history.</p>
          </ActionForm>
        </article>

        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Lifetime overview</span><h2>{overviews.length} resident profile{overviews.length === 1 ? "" : "s"}</h2></div></div>
          <div className="profile-grid profile-grid-ledger">{overviews.map((overview) => {
            const member = overview.member;
            const active = !member.leftOn;
            const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return <div className={`profile-card ledger-profile-card ${active ? "" : "archived"}`} key={member.id}>
              <div className="profile-top"><div className="avatar">{initials}</div><span className={`status-dot ${active ? "active" : "inactive"}`}>{active ? "Active" : "Archived"}</span></div>
              <h3>{member.name}</h3>
              <div className="profile-meta"><span><Globe2 size={15} />{member.nationality}</span><span><Phone size={15} />{member.phone}</span><span>Joined {formatDate(member.joinedOn)} · {overview.monthsResident} month{overview.monthsResident === 1 ? "" : "s"}</span>{member.leftOn && <span>Left {formatDate(member.leftOn)}</span>}</div>

              <div className="member-ledger-numbers">
                <div><span>Total responsibility</span><strong>{euro(overview.totalResponsibility)}</strong></div>
                <div><span>Recorded paid</span><strong>{euro(overview.recordedCashPaid)}</strong></div>
                <div className={overview.totalDue > 0.009 ? "is-due" : "is-clear"}><span>Still due</span><strong>{overview.totalDue > 0.009 ? euro(overview.totalDue) : "€0.00 clear"}</strong></div>
                <div><span>Roommate balance</span><strong>{overview.roommateCredit > 0.009 ? `gets ${euro(overview.roommateCredit)}` : overview.roommateDue > 0.009 ? `owes ${euro(overview.roommateDue)}` : "settled"}</strong></div>
              </div>

              <div className="profile-ledger-actions">
                <Link className="button primary compact" href={`/members/${member.id}`}>Full ledger <ArrowUpRight size={14} /></Link>
                <form action={setMemberStatusAction}><input type="hidden" name="id" value={member.id} /><input type="hidden" name="mode" value={active ? "archive" : "reactivate"} />{active && <input type="hidden" name="date" value={today} />}<button className="button secondary compact" type="submit">{active ? "Archive / moved out" : "Reactivate"}</button></form>
              </div>
            </div>;
          })}</div>
          {!overviews.length && <div className="empty-profiles"><Users size={26} /><strong>Add the six residents</strong><p>Create each person once; all monthly calculations and lifetime records will use these profiles.</p></div>}
        </article>
      </section>
    </>
  );
}
