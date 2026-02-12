"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = [
  "rgb(99, 102, 241)",   // indigo
  "rgb(16, 185, 129)",   // emerald
  "rgb(245, 158, 11)",   // amber
  "rgb(239, 68, 68)",    // red
  "rgb(59, 130, 246)",   // blue
  "rgb(168, 85, 247)",   // purple
  "rgb(20, 184, 166)",   // teal
  "rgb(249, 115, 22)",   // orange
];

const CHART_COLORS_ALPHA = CHART_COLORS.map((c) => c.replace("rgb", "rgba").replace(")", ", 0.15)"));

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  height?: number;
}

export function DoughnutChart({ labels, data, height = 220 }: DoughnutChartProps) {
  return (
    <div style={{ height }}>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: CHART_COLORS_ALPHA.slice(0, data.length),
              borderColor: CHART_COLORS.slice(0, data.length),
              borderWidth: 1.5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
                font: { size: 11 },
              },
            },
          },
        }}
      />
    </div>
  );
}

interface BarChartProps {
  labels: string[];
  data: number[];
  label?: string;
  height?: number;
  horizontal?: boolean;
}

export function BarChart({ labels, data, label = "", height = 220, horizontal = false }: BarChartProps) {
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label,
              data,
              backgroundColor: CHART_COLORS_ALPHA.slice(0, data.length),
              borderColor: CHART_COLORS.slice(0, data.length),
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: horizontal ? "y" : "x",
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 } },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  height?: number;
}

export function LineChart({ labels, datasets, height = 220 }: LineChartProps) {
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.color || CHART_COLORS[i % CHART_COLORS.length],
            backgroundColor: ds.color
              ? ds.color.replace("rgb", "rgba").replace(")", ", 0.1)")
              : CHART_COLORS_ALPHA[i % CHART_COLORS_ALPHA.length],
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: datasets.length > 1,
              position: "bottom",
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
                font: { size: 11 },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 } },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
