"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-stone-500 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-stone-900 text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
