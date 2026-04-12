import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="norse-card p-8 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl tracking-widest text-gradient-gold uppercase">
            Lost in the Mist
          </h2>
          <p className="text-6xl font-display text-muted-foreground/30">404</p>
          <p className="text-sm text-muted-foreground font-body">
            This path leads nowhere. The page you seek does not exist.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Return to the Realm</Link>
        </Button>
      </div>
    </div>
  );
}
