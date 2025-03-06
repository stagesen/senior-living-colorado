import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Senior Living Colorado
          </Link>

          <div className="flex gap-4">
            <Link href="/resources">
              <Button variant="ghost" className="text-lg">
                Resource Directory
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}