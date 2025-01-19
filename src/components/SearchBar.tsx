import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  return (
    <div className="relative flex w-full max-w-2xl">
      <Input
        type="text"
        placeholder="Search by location, property type..."
        className="pr-12"
      />
      <Button
        size="icon"
        className="absolute right-0 h-full rounded-l-none"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
}