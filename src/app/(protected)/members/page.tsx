import { Globe2, Phone, UserPlus, Users } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { createMemberAction, setMemberStatusAction } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { getAllMembers } from "@/lib/data";

export const metadata = { title: "Residents" };

export default async function MembersPage() {
  const members = await getAllMembers();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Household profiles</span><h1>Residents</h1><p>Profiles determine who participates in each month’s calculation.</p></div><div className="header-count"><Users size={18} /> {members.filter((m) => !m.leftOn).length} current</div></header>
      <section className="two-column-form members-layout">
        <article className="card sticky-card">
          <div className="card-head"><div><span className="eyebrow">New profile</span><h2>Add resident</h2></div><UserPlus size={20} /></div>
          <ActionForm action={createMemberAction} submitLabel="Create resident profile">
            <label className="field"><span>Full name</span><input name="name" placeholder="Resident name" required /></label>
            <label className="field"><span>Nationality</span><input name="nationality" placeholder="e.g. Pakistani, Italian" required /></label>
            <label className="field"><span>Phone number</span><input name="phone" type="tel" placeholder="+39 …" required /></label>
            <label className="field"><span>Living here since</span><input name="joinedOn" type="date" defaultValue={today} required /></label>
            <p className="form-hint">A move-out date archives the resident without deleting their old monthly records.</p>
          </ActionForm>
        </article>
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Apartment directory</span><h2>{members.length} resident profile{members.length === 1 ? "" : "s"}</h2></div></div>
          <div className="profile-grid">{members.map((member) => {
            const active = !member.leftOn;
            const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return <div className={`profile-card ${active ? "" : "archived"}`} key={member.id}>
              <div className="profile-top"><div className="avatar">{initials}</div><span className={`status-dot ${active ? "active" : "inactive"}`}>{active ? "Active" : "Archived"}</span></div>
              <h3>{member.name}</h3>
              <div className="profile-meta"><span><Globe2 size={15} />{member.nationality}</span><span><Phone size={15} />{member.phone}</span><span>Joined {formatDate(member.joinedOn)}</span>{member.leftOn && <span>Left {formatDate(member.leftOn)}</span>}</div>
              <form action={setMemberStatusAction} className="profile-action"><input type="hidden" name="id" value={member.id} /><input type="hidden" name="mode" value={active ? "archive" : "reactivate"} />{active && <input type="hidden" name="date" value={today} />}<button className="button secondary compact" type="submit">{active ? "Archive / moved out" : "Reactivate"}</button></form>
            </div>;
          })}</div>
          {!members.length && <div className="empty-profiles"><Users size={26} /><strong>Add the six residents</strong><p>Create each person once; all monthly calculations will use these profiles.</p></div>}
        </article>
      </section>
    </>
  );
}
