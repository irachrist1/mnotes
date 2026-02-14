"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <Skeleton className="h-6 w-6 rounded-md" />
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
