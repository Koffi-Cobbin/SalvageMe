"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Select, Input, Button } from "@/components/ui";

const conditionOptions = [
  { value: "", label: "Any condition" },
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
];

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [gradeLevel, setGradeLevel] = useState(searchParams.get("gradeLevel") ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.listCategories(),
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="mb-4 md:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filters-panel"
      >
        <SlidersHorizontal size={16} className="mr-1.5" aria-hidden="true" />
        Filters
      </Button>

      <div id="filters-panel" className={`${open ? "block" : "hidden"} md:block`}>
        <div className="flex flex-col gap-4 rounded-xl2 border border-paper-300 bg-white p-4">
          <Select
            label="Category"
            options={[
              { value: "", label: "All categories" },
              ...(categories?.map((c) => ({ value: c.slug, label: c.name })) ?? []),
            ]}
            defaultValue={searchParams.get("category") ?? ""}
            onChange={(e) => updateParam("category", e.target.value)}
          />
          <Select
            label="Condition"
            options={conditionOptions}
            defaultValue={searchParams.get("condition") ?? ""}
            onChange={(e) => updateParam("condition", e.target.value)}
          />
          <Input
            label="Grade level"
            placeholder="e.g. 9th-10th grade"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            onBlur={() => updateParam("gradeLevel", gradeLevel)}
          />
        </div>
      </div>
    </>
  );
}
