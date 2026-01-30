import { LoadingView } from "@/components/LoadingView";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[2147483647] bg-white dark:bg-black">
      <LoadingView variant="page" />
    </div>
  );
}
