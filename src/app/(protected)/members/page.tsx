import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, Phone, ReceiptText, UserPlus, Users, WalletCards, Zap } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { createMemberAction, setMemberStatusAction } from "@/app/actions";
import { countryBadge } from "@/lib/country";
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
  const totalResponsibility = overviews.reduce((sum, item) => sum + item.totalResponsibility, 0);

  return (
    <>
      <header className="page-header">
        <div><span className="eyebrow">Household profiles & lifetime ledger</span><h1>Residents</h1><p>Each profile shows the complete record from the resident&apos;s join month through today.</p></div>
        <div className="header-count"><Users size={18} /> {activeCount} current</div>
      </header>

      <section className="member-overview-stats four-up">
        <div className="member-overview-stat"><Users size={18} /><div><span>Resident profiles</span><strong>{overviews.length}</strong></div></div>
        <div className="member-overview-stat"><ReceiptText size={18} /><div><span>Total responsibility</span><strong>{euro(totalResponsibility)}</strong></div></div>
        <div className="member-overview-stat"><WalletCards size={18} /><div><span>Recorded paid</span><strong>{euro(totalRecordedPaid)}</strong></div></div>
        <div className={`member-overview-stat ${totalDue > 0.009 ? "due" : "clear"}`}><CircleDollarSign size={18} /><div><span>Combined still due</span><strong>{euro(totalDue)}</strong></div></div>
      </section>

      <section className="two-column-form members-layout">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New profile</span><h2>Add resident</h2></div><UserPlus size={20} /></div>
          <ActionForm action={createMemberAction} submitLabel="Create resident profile">
            <label className="field"><span>Full name</span><input name="name" placeholder="Resident name" required /></label>
            <label className="field"><span>Nationality</span><input name="nationality" list="nationality-options" placeholder="Pakistan / Bangladesh" required /><datalist id="nationality-options"><option value="Pakistan" /><option value="Bangladesh" /><option value="Italy" /></datalist></label>
            <label className="field"><span>Phone number</span><input name="phone" type="tel" placeholder="+39 …" required /></label>
            <label className="field"><span>Living here since</span><input name="joinedOn" type="date" defaultValue={today} required /></label>
            <div className="country-preview-note"><span>🇵🇰 Pakistan</span><span>🇧🇩 Bangladesh</span><span>🇮🇹 Italy</span></div>
            <p className="form-hint">SAMS keeps the resident&apos;s old months even after they move out, so historic balances never disappear.</p>
          </ActionForm>
        </article>

        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Lifetime overview</span><h2>{overviews.length} resident profile{overviews.length === 1 ? "" : "s"}</h2></div><span className="small-note">Paid = confirmed rent + confirmed utility shares + purchases personally paid.</span></div>
          <div className="profile-grid profile-grid-ledger">{overviews.map((overview) => {
            const member = overview.member;
            const active = !member.leftOn;
            const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            const country = countryBadge(member.nationality);
            return <div className={`profile-card ledger-profile-card ${active ? "" : "archived"}`} key={member.id}>
              <div className="profile-top">
                <div className="profile-identity"><div className="avatar">{initials}</div><div className={`country-badge country-${country.code.toLowerCase()}`}><span>{country.flag}</span><small>{country.label}</small></div></div>
                <span className={`status-dot ${active ? "active" : "inactive"}`}>{active ? "Active" : "Archived"}</span>
              </div>
              <h3>{member.name}</h3>
              <div className="profile-meta"><span><Phone size={15} />{member.phone}</span><span>Joined {formatDate(member.joinedOn)} · {overview.monthsResident} month{overview.monthsResident === 1 ? "" : "s"}</span>{member.leftOn && <span>Left {formatDate(member.leftOn)}</span>}</div>

              <div className="member-ledger-numbers expanded">
                <div><span>Total responsibility</span><strong>{euro(overview.totalResponsibility)}</strong></div>
                <div><span>Recorded paid</span><strong>{euro(overview.recordedCashPaid)}</strong></div>
                <div><span>Rent</span><strong>{euro(overview.rentPaid)} / {euro(overview.rentCharged)}</strong><small>{euro(overview.rentDue)} due</small></div>
                <div><span>Utilities</span><strong>{euro(overview.utilitiesPaid)} / {euro(overview.utilitiesCharged)}</strong><small>{euro(overview.utilityDue)} due</small></div>
                <div><span>Groceries / house share</span><strong>{euro(overview.groceriesCharged)}</strong><small>{euro(overview.housePurchasesPaid)} personally purchased</small></div>
                <div><span>Roommate balance</span><strong>{overview.roommateCredit > 0.009 ? `gets ${euro(overview.roommateCredit)}` : overview.roommateDue > 0.009 ? `owes ${euro(overview.roommateDue)}` : "settled"}</strong></div>
                <div className={`wide ${overview.totalDue > 0.009 ? "is-due" : "is-clear"}`}><span>Overall still due</span><strong>{overview.totalDue > 0.009 ? euro(overview.totalDue) : "€0.00 clear"}</strong><small>Rent + utilities + grocery/house roommate balance</small></div>
              </div>

              <div className="profile-ledger-actions">
                <Link className="button primary compact" href={`/members/${member.id}`}>Full ledger <ArrowUpRight size={14} /></Link>
                <Link className="button secondary compact" href={`/utilities`}>Utilities <Zap size={13} /></Link>
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
