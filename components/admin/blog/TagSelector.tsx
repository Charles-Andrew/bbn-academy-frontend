"use client";

import { Hash, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAdminStore } from "@/store/admin-store";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  placeholder = "Add tags...",
  maxTags = 10,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { blogTags, setBlogTags } = useAdminStore();

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch("/api/admin/blogs/tags");
        if (response.ok) {
          const data = await response.json();
          setBlogTags(data.tags);
        }
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };

    if (blogTags.length === 0) {
      loadTags();
    }
  }, [blogTags.length, setBlogTags]);

  // Filter existing tags based on search
  const filteredTags = blogTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedTags.includes(tag.name),
  );

  const handleAddTag = (tagName: string) => {
    if (selectedTags.length >= maxTags) return;
    if (!tagName.trim() || selectedTags.includes(tagName.trim())) return;

    const cleanTag = tagName.trim().toLowerCase();
    onTagsChange([...selectedTags, cleanTag]);
    setNewTag("");
    setSearchTerm("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(newTag);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setNewTag("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-input rounded-md bg-background">
        {selectedTags.length === 0 ? (
          <span className="text-muted-foreground text-sm">
            No tags selected
          </span>
        ) : (
          selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Hash className="h-3 w-3" />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Tag Input */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start"
            disabled={selectedTags.length >= maxTags}
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedTags.length >= maxTags
              ? `Maximum ${maxTags} tags reached`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-4 space-y-3">
            {/* New Tag Input */}
            <div>
              <Input
                placeholder="Create new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter to add, or select from existing tags below
              </p>
            </div>

            {/* Existing Tags Search */}
            <div>
              <Input
                placeholder="Search existing tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Existing Tags List */}
            {filteredTags.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag.name)}
                    className="w-full text-left p-2 hover:bg-accent rounded-sm flex items-center gap-2"
                  >
                    <Hash className="h-3 w-3" />
                    <span className="flex-1">{tag.name}</span>
                    {tag.color && (
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No tags found matching "{searchTerm}"
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No existing tags. Create one above!
              </p>
            )}

            {/* Tag Count */}
            <div className="text-xs text-muted-foreground border-t pt-2">
              {selectedTags.length} of {maxTags} tags selected
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Add */}
      {newTag && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddTag(newTag)}
            disabled={selectedTags.length >= maxTags}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add "{newTag}"
          </Button>
        </div>
      )}
    </div>
  );
}
