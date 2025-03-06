import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Menu, Search, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CARE_TYPES = [
  "Independent Living",
  "Assisted Living",
  "Memory Care",
  "Skilled Nursing",
  "Continuing Care",
];

const LOCATIONS = [
  "Denver",
  "Boulder",
  "Fort Collins",
  "Colorado Springs",
  "Longmont",
  "Loveland",
  "Greeley",
];

const ListItem = ({ className, title, href, onSelect }: { className?: string; title: string; href: string; onSelect?: () => void }) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        onClick={onSelect}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
      </Link>
    </NavigationMenuLink>
  </li>
);

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const MobileNav = () => (
    <div className="py-4 space-y-4">
      <div className="px-3 py-1">
        <h2 className="mb-2 text-lg font-semibold">Care Types</h2>
        {CARE_TYPES.map((type) => (
          <Link
            key={type}
            href={`/care-types/${type.toLowerCase().replace(/\s+/g, '-')}`}
            className="block py-2 text-muted-foreground hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            {type}
          </Link>
        ))}
      </div>

      <div className="px-3 py-1">
        <h2 className="mb-2 text-lg font-semibold">Front Range Locations</h2>
        {LOCATIONS.map((location) => (
          <Link
            key={location}
            href={`/locations/${location.toLowerCase().replace(/\s+/g, '-')}`}
            className="block py-2 text-muted-foreground hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            {location}
          </Link>
        ))}
      </div>

      <div className="px-3 py-1">
        <h2 className="mb-2 text-lg font-semibold">Resources</h2>
        <Link
          href="/resources"
          className="block py-2 text-muted-foreground hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          Resource Directory
        </Link>
        <Link
          href="/cost-calculator"
          className="block py-2 text-muted-foreground hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          Cost Calculator
        </Link>
        <Link
          href="/chat-advisor"
          className="block py-2 text-muted-foreground hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          Chat with Advisor
        </Link>
      </div>
    </div>
  );

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gradient">
            Senior Living Colorado
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Care Types</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {CARE_TYPES.map((type) => (
                        <ListItem
                          key={type}
                          title={type}
                          href={`/care-types/${type.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Front Range Locations</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {LOCATIONS.map((location) => (
                        <ListItem
                          key={location}
                          title={location}
                          href={`/locations/${location.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <ListItem title="Resource Directory" href="/resources" />
                      <ListItem title="Cost Calculator" href="/cost-calculator" />
                      <ListItem title="Chat with Advisor" href="/chat-advisor" />
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MapPin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <MobileNav />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}