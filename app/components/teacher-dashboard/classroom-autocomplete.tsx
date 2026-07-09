import { useId, useState, type KeyboardEvent } from "react";
import type { DashboardClassroomOption } from "~/features/teacher-dashboard/dashboard";

const fieldClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ClassroomAutocomplete({
  id,
  name = "classroomName",
  classrooms,
  defaultValue,
  placeholder = "예: Room A101",
  required,
  disabled,
}: {
  id?: string;
  name?: string;
  classrooms: DashboardClassroomOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState(defaultValue ?? classrooms[0]?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = normalizeClassroomName(query);

  const filteredClassrooms = classrooms
    .filter((classroom) => {
      if (normalizedQuery === "") {
        return true;
      }

      return normalizeClassroomName(classroom.name).includes(normalizedQuery);
    })
    .slice(0, 8);

  const selectClassroom = (classroomName: string) => {
    setQuery(classroomName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        if (filteredClassrooms.length === 0) {
          return -1;
        }

        return currentIndex >= filteredClassrooms.length - 1
          ? 0
          : currentIndex + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        if (filteredClassrooms.length === 0) {
          return -1;
        }

        return currentIndex <= 0
          ? filteredClassrooms.length - 1
          : currentIndex - 1;
      });
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectClassroom(filteredClassrooms[activeIndex]?.name ?? query);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        value={query}
        className={fieldClassName}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        required={required}
        disabled={disabled}
      />

      {isOpen && (filteredClassrooms.length > 0 || normalizedQuery !== "") ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-3xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur-sm"
        >
          {filteredClassrooms.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredClassrooms.map((classroom, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={classroom.id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={
                      isActive
                        ? "flex w-full items-center rounded-2xl bg-accent px-3 py-2 text-left text-sm text-accent-foreground"
                        : "flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/60"
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectClassroom(classroom.name)}
                  >
                    {classroom.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              일치하는 교실이 없습니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function normalizeClassroomName(name: string) {
  return name.trim().toLowerCase();
}
