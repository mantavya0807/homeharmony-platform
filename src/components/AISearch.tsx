// src/components/AISearch.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Loader2, Bot, Search, Stars } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AISearchProps {
  onSearch: (query: string) => Promise<void>;
  loading: boolean;
}

export function AISearch({ onSearch, loading }: AISearchProps) {
  const [query, setQuery] = useState("");
  const [showExamples, setShowExamples] = useState(true);

  const searchExamples = [
    "I need a 2 bedroom apartment in State College under $1500",
    "Looking for a house with 3+ bathrooms and a large square footage",
    "Show me properties in downtown area with 2 beds and 2 baths",
    "Find me the cheapest 1 bedroom apartments available"
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowExamples(false);
    await onSearch(query);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    onSearch(example);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI-Powered Property Search
          </CardTitle>
          <CardDescription>
            Describe what you're looking for in natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., I need a 2 bedroom apartment in State College under $1500"
                className="pr-10"
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Stars className="h-4 w-4" />
                  Try these examples:
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchExamples.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(example)}
                      className="text-sm"
                    >
                      "{example}"
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}