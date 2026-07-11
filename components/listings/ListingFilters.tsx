"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, Button } from "@/components/ui";

const categoryOptions = [
  { value: "", label: "All categories" },
  { value: "Fiction", label: "Fiction" },
  { value: "Science", label: "Science" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "History", label: "History" },
];

const conditionOptions = [
  { value: "", label: "Any condition" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
];

const gradeOptions = [
  { value: "", label: "Any grade level" },
  { value: "pre_k", label: "Pre-K" },
  { value: "elementary", label: "Elementary" },
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "adult_education", label: "Adult Education" },
];

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

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
            options={categoryOptions}
            defaultValue={searchParams.get("category") ?? ""}
            onChange={(e) => updateParam("category", e.target.value)}
          />
          <Select
            label="Condition"
            options={conditionOptions}
            defaultValue={searchParams.get("condition") ?? ""}
            onChange={(e) => updateParam("condition", e.target.value)}
          />
          <Select
            label="Grade level"
            options={gradeOptions}
            defaultValue={searchParams.get("gradeLevel") ?? ""}
            onChange={(e) => updateParam("gradeLevel", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
