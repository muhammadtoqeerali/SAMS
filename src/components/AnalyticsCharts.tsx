"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { euro } from "@/lib/format";
import type { MemberBalance, TrendPoint } from "@/lib/types";

const axisTick = { fontSize: 12, fill: "var(--muted)" };

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `€${v}`} />
          <Tooltip formatter={(value) => euro(Number(value))} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)" }} />
          <Area type="monotone" dataKey="total" name="Total" stroke="var(--accent)" strokeWidth={2.5} fill="url(#totalFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContributionChart({ data }: { data: MemberBalance[] }) {
  const chartData = data.map((item) => ({ name: item.name.split(" ")[0], paid: item.paidForHouse, share: item.internalShare }));
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `€${v}`} />
          <Tooltip formatter={(value) => euro(Number(value))} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="paid" name="Paid" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="share" name="Fair share" fill="var(--soft-accent-strong)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
