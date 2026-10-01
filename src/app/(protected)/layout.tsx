import { Building2, LogOut } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { AppNav } from "@/components/AppNav";
import { logoutAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const settings = await getSettings();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="logo-orb small"><Building2 size={20} /></div>
          <div><strong>SAMS</strong><span>{settings.householdName}</span></div>
        </div>
        <AppNav />
        <form action={logoutAction} className="sidebar-logout">
          <button className="nav-link logout" type="submit"><LogOut size={18} /><span>Sign out</span></button>
        </form>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
