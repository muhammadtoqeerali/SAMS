import { LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { updateSettingsAction } from "@/app/actions";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Household configuration</span><h1>Settings</h1><p>Keep the recurring apartment rules in one place.</p></div></header>
      <section className="settings-grid">
        <article className="card">
          <div className="card-head"><div><span className="eyebrow">Apartment</span><h2>General settings</h2></div><Settings2 size={20} /></div>
          <ActionForm action={updateSettingsAction} submitLabel="Save settings" resetOnSuccess={false}>
            <label className="field"><span>Apartment name</span><input name="householdName" defaultValue={settings.householdName} required /></label>
            <label className="field"><span>Rent per resident (€ / month)</span><input name="rentPerPerson" type="number" min="0" step="0.01" defaultValue={settings.rentPerPerson} required /></label>
            <p className="form-hint">Changing rent affects calculations for all viewed months. Keep this at €150 unless the household agreement changes.</p>
          </ActionForm>
        </article>
        <article className="card security-card">
          <div className="security-icon"><ShieldCheck size={24} /></div>
          <span className="eyebrow">Access security</span><h2>Shared password stays outside the database</h2>
          <p>SAMS reads <code>HOUSEHOLD_PASSWORD</code> from the server environment. The browser only receives a signed, HTTP-only session cookie.</p>
          <div className="security-row"><LockKeyhole size={18} /><div><strong>To change the password</strong><span>Update the Vercel environment variable and redeploy. No database edit is required.</span></div></div>
        </article>
      </section>
    </>
  );
}
