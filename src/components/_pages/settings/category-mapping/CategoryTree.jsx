// components/_partials/CategoryTree.tsx
import React from "react";

export default function CategoryTree({
  categories,
  checked,
  onToggle,
  expanded,
  setExpanded,
  type,
  onAdd,
}) {
  return categories.map((cat) => {
    const id = cat.id || cat._id;
    const isChecked = checked.some((c) => (c.id || c._id) === id);
    const isExpanded = expanded[id];

    return (
      <div key={id} className="mb-1">
        <div className="flex items-center p-2 rounded hover:bg-indigo-50">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggle(cat)}
            className="mr-2 h-4 w-4 text-indigo-600"
          />
          <span
            className="flex-1 cursor-pointer"
            onClick={() =>
              cat.children?.length &&
              setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
            }
          >
            {cat.name}
            {type === "vendor" && cat.product_count
              ? ` (${cat.product_count})`
              : ""}
          </span>
          {type === "our" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(id);
              }}
              className="ml-2 text-xs border rounded px-2 text-indigo-600"
            >
              Add
            </button>
          )}
        </div>
        {isExpanded && cat.children?.length > 0 && (
          <div className="ml-4 border-l pl-2">
            <CategoryTree
              categories={cat.children}
              checked={checked}
              onToggle={onToggle}
              expanded={expanded}
              setExpanded={setExpanded}
              type={type}
              onAdd={onAdd}
            />
          </div>
        )}
      </div>
    );
  });
}
