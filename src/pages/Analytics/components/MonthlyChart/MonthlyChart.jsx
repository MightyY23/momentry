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
          />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="memories"
            radius={[10, 10, 0, 0]}
            fill="#ff5c8d"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyChart;