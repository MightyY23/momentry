import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import styles from "./MonthlyChart.module.css";

function MonthlyChart({ moments }) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const data = months.map((month, index) => ({
    month,
    memories: moments.filter((moment) => {
      if (!moment.memory_date) return false;

      return (
        new Date(moment.memory_date).getMonth() ===
        index
      );
    }).length,
  }));

  return (
    <div className={styles.card}>
      <h2>📈 Memories Over Time</h2>

      <ResponsiveContainer
        width="100%"
        height={340}
      >
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
          />

          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            tick={{
              fill: "var(--text-secondary)",
              fontSize: 12,
            }}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fill: "var(--text-secondary)",
              fontSize: 12,
            }}
          />

          <Tooltip
            contentStyle={{
              background:
                "var(--surface-elevated, #fff)",
              border:
                "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
            }}
            cursor={{
              fill: "var(--primary-50)",
            }}
          />

          <Bar
            dataKey="memories"
            radius={[10, 10, 0, 0]}
            fill="var(--primary)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyChart;