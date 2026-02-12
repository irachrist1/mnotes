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
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
