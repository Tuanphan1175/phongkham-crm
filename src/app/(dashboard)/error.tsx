"use client";

export default function DashboardError({
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-red-600 font-medium">Đã xảy ra lỗi</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
      >
        Thử lại
      </button>
    </div>
  );
}
