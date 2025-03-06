import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search..." }: SearchBarProps) {
  const [searchText, setSearchText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchText);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          type="search"
          placeholder={placeholder}
          className="pl-12 pr-28 py-6 h-14 text-lg rounded-full border-input bg-card shadow-sm focus-visible:ring-2"
        />
        <div className="absolute right-1.5">
          <Button 
            type="submit" 
            size="sm" 
            className="rounded-full h-11 px-5 bg-primary hover:bg-primary/90 transition-colors"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}