import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gradient">
            Senior Living Colorado
          </Link>

          <div className="flex gap-4 items-center">
            <Link href="/resources">
              <Button variant="ghost" className="text-base font-medium">
                Resource Directory
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="outline" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}