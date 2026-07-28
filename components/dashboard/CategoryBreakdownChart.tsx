"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardStats } from "@/lib/stats";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";

interface CategoryBreakdownChartProps {
  breakdown: DashboardStats["categoryBreakdown"];
}

export function CategoryBreakdownChart({ breakdown }: CategoryBreakdownChartProps) {
  if (breakdown.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No spending data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-56 sm:shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={breakdown}
              dataKey="amount"
              nameKey="category"
              innerRadius="60%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={2}
              stroke="#ffffff"
            >
              {breakdown.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_META[entry.category].color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2.5">
        {breakdown.map((entry) => (
          <li key={entry.category} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_META[entry.category].color }}
              />
              <span className="text-slate-600">{entry.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{formatCurrency(entry.amount)}</span>
              <span className="w-10 text-right text-xs text-slate-400">
                {entry.percent.toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
