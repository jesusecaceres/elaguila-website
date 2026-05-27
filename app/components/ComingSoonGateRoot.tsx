import { ComingSoonGate } from "./ComingSoonGate";

const COMING_SOON_LOCKED = process.env.NEXT_PUBLIC_COMING_SOON_LOCK === "true";

export function ComingSoonGateRoot({ children }: { children: React.ReactNode }) {
  if (COMING_SOON_LOCKED) {
    return <ComingSoonGate />;
  }
  return <>{children}</>;
}
