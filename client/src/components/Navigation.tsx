import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Colorado Senior Resources
          </Link>

          <div className="flex gap-4">
            <Link href="/resources">
              <Button variant="ghost" className="text-lg">
                Resource Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}