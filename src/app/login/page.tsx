import { redirect } from "next/navigation";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");
  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-visual">
          <div className="brand-chip"><Building2 size={18} /> SAMS</div>
          <div>
            <span className="eyebrow light">Smart apartment management</span>
            <h1>One clear place for every shared apartment cost.</h1>
            <p>Track groceries, rent, electricity, water and exactly who should settle with whom — month by month.</p>
          </div>
          <div className="login-points">
            <span><CheckCircle2 size={17} /> Automatic monthly calculations</span>
            <span><CheckCircle2 size={17} /> Historical records stay intact</span>
            <span><ShieldCheck size={17} /> Private shared-household access</span>
          </div>
        </div>
        <div className="login-panel">
          <div className="login-copy">
            <div className="logo-orb"><Building2 size={23} /></div>
            <span className="eyebrow">Welcome home</span>
            <h2>Enter your apartment</h2>
            <p>Use the shared password known by the residents of this apartment.</p>
          </div>
          <LoginForm />
          <p className="login-footnote">The password is checked only on the server and is never stored in the browser.</p>
        </div>
      </section>
    </main>
  );
}
