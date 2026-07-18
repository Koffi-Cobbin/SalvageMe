import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button, Select } from "@/components/ui";
import type { ListingCondition } from "@/types";

const conditionOptions = [
  { value: "", label: "Any condition" },
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
];

export function ListingFilters() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const [open, setOpen] = useState(false);
  const [gradeLevel, setGradeLevel] = useState(searchParams.get("gradeLevel") ?? "");

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.listCategories() });

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...(categories?.map((c) => ({ value: c.slug, label: c.name })) ?? []),
  ];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(search);
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    setLocation(`/listings${qs ? `?${qs}` : ""}`);
  }

  function clearAll() {
    setGradeLevel("");
    setLocation("/listings");
  }

  const hasFilters = !!(searchParams.get("category") || searchParams.get("condition") || searchParams.get("gradeLevel"));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 rounded-lg border border-paper-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-paper-200"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasFilters && <span className="ml-1 rounded-full bg-terracotta-500 px-1.5 py-0.5 text-xs text-white">•</span>}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-ink-700/60 hover:text-terracotta-600">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-wrap gap-3 rounded-xl2 border border-paper-300 bg-white p-4">
          <div className="min-w-40">
            <Select
              label="Category"
              options={categoryOptions}
              value={searchParams.get("category") ?? ""}
              onChange={(e) => updateParam("category", e.target.value)}
            />
          </div>
          <div className="min-w-40">
            <Select
              label="Condition"
              options={conditionOptions}
              value={(searchParams.get("condition") as ListingCondition) ?? ""}
              onChange={(e) => updateParam("condition", e.target.value)}
            />
          </div>
          <div className="min-w-48">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-800">Grade level</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-paper-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  placeholder="e.g. 7th-9th grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updateParam("gradeLevel", gradeLevel)}
                />
                <Button size="sm" variant="secondary" onClick={() => updateParam("gradeLevel", gradeLevel)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
