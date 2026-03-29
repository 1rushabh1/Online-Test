import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

type Attempt = {
  obtained_marks: number;
  total_marks: number;
  status: string;
  created_at: string;
};

export default function AnalyticsDashboard({ attempts }: { attempts: Attempt[] }) {
  if (!attempts || attempts.length === 0) {
    return <p className="text-sm text-gray-500">No analytics data available</p>;
  }

  // 🔹 Average score
  const avgScore =
    attempts.reduce((acc, a) => acc + (a.obtained_marks / a.total_marks) * 100, 0) /
    attempts.length;

  // 🔹 Pass/Fail
  const pass = attempts.filter(
    (a) => (a.obtained_marks / a.total_marks) * 100 >= 40
  ).length;

  const fail = attempts.length - pass;

  const pieData = [
    { name: 'Pass', value: pass },
    { name: 'Fail', value: fail },
  ];

  // 🔹 Score distribution
  const ranges = {
    '0-40': 0,
    '40-60': 0,
    '60-80': 0,
    '80-100': 0,
  };

  attempts.forEach((a) => {
    const percent = (a.obtained_marks / a.total_marks) * 100;
    if (percent < 40) ranges['0-40']++;
    else if (percent < 60) ranges['40-60']++;
    else if (percent < 80) ranges['60-80']++;
    else ranges['80-100']++;
  });

  const barData = Object.keys(ranges).map((key) => ({
    range: key,
    count: ranges[key as keyof typeof ranges],
  }));

  // 🔹 Attempts over time
  const dateMap: Record<string, number> = {};

  attempts.forEach((a) => {
    const date = new Date(a.created_at).toLocaleDateString();
    dateMap[date] = (dateMap[date] || 0) + 1;
  });

  const lineData = Object.keys(dateMap).map((date) => ({
    date,
    attempts: dateMap[date],
  }));

  return (
    <div className="space-y-8">

      {/* Avg Score */}
      <div className="text-lg font-semibold">
        Average Score: {avgScore.toFixed(2)}%
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Pie */}
        <div className="h-64">
          <h3 className="mb-2 font-medium">Pass vs Fail</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={80}>
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="h-64">
          <h3 className="mb-2 font-medium">Score Distribution</h3>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Line */}
      <div className="h-64">
        <h3 className="mb-2 font-medium">Attempts Over Time</h3>
        <ResponsiveContainer>
          <LineChart data={lineData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="attempts" stroke="#7c3aed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}