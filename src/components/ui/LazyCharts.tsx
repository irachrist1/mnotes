"use client";

import dynamic from "next/dynamic";

const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-6 w-6 rounded-md bg-stone-200 dark:bg-stone-700 animate-pulse" />
  </div>
);

export const DoughnutChart = dynamic(
  () => import("./Charts").then((m) => m.DoughnutChart),
  { ssr: false, loading: Spinner }
);

export const BarChart = dynamic(
  () => import("./Charts").then((m) => m.BarChart),
  { ssr: false, loading: Spinner }
);

export const LineChart = dynamic(
  () => import("./Charts").then((m) => m.LineChart),
  { ssr: false, loading: Spinner }
);
