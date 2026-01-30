"use client";

import { LoadingView } from "@/components/LoadingView";
import { Portal } from "@/components/Portal";

type Props = {
  active: boolean;
  label?: string;
};

export function LoadingOverlay({ active, label }: Props) {
  if (!active) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[2147483647] bg-white dark:bg-black">
        <LoadingView variant="page" label={label} />
      </div>
    </Portal>
  );
}
