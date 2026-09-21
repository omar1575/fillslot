import { cn } from "cn";

export function PeopleCount({
  signedIn,
  max,
  className,
}: {
  signedIn: number;
  max: number;
  className?: string;
}) {
  return (
    <p className={cn("font-mono text-xs tracking-[0.16em] uppercase", className)}>
      {signedIn} signed in · max {max}
    </p>
  );
}
