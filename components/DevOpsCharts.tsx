"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";
import { DevOpsMetrics } from "@/lib/metrics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  metrics: DevOpsMetrics;
}

export function DevOpsCharts({ metrics }: ChartsProps) {
  const deploymentData = {
    labels: metrics.trends.deployments.map((d) => d.date),
    datasets: [
      {
        label: "Deployments",
        data: metrics.trends.deployments.map((d) => d.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const successData = {
    labels: ["Success", "Failure"],
    datasets: [
      {
        data: [metrics.trends.successVsFailure.success, metrics.trends.successVsFailure.failure],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"],
        borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderWidth: 1,
      },
    ],
  };

  const prData = {
    labels: metrics.trends.prActivity.map((d) => d.date),
    datasets: [
      {
        label: "PR Activity",
        data: metrics.trends.prActivity.map((d) => d.count),
        backgroundColor: "rgba(99, 102, 241, 0.6)",
      },
    ],
  };

  const durationData = {
    labels: metrics.trends.buildDurations.map((d) => d.date),
    datasets: [
      {
        label: "Build Duration (min)",
        data: metrics.trends.buildDurations.map((d) => d.duration),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        fill: true,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Deployment Frequency</h3>
        <Line data={deploymentData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Success vs Failure</h3>
        <div className="max-w-[250px] mx-auto">
          <Pie data={successData} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">PR Activity</h3>
        <Bar data={prData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Build Duration Trend</h3>
        <Line data={durationData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
}
