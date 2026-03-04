"use client";

import React from "react";
import { Button } from "@/components/ui/button";

/**
 * CategorySection — Our Categories column
 * Props:
 * - title
 * - categories
 * - checked
 * - onToggle(cat)
 * - expandedParents / setExpandedParents
 * - ourSearch / setOurSearch
 * - loading
 * - onAdd(id)
 * - router (for Manage link)
 */

const CategorySection = ({
  title,
  categories = [],
  checked = [],
  onToggle,
  expandedParents,
  setExpandedParents,
  ourSearch,
  setOurSearch,
  loading,
  onAdd,
  router,
}) => {
  const renderCategories = (cats) =>
    cats.map((cat) => {
      const id = cat.id || cat._id;
      const isChecked = checked.some((s) => (s.id || s._id) === id);
      const isExpanded = !!expandedParents[id];
      return (
        <div key={id} className="mb-1">
          <div className="flex items-center p-2 rounded-md transition hover:bg-indigo-50 text-gray-700">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(cat)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span
              onClick={() => {
                if (cat.children?.length > 0) {
                  setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
                }
              }}
              className="cursor-pointer flex-1"
            >
              {cat.name}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(id);
              }}
              className="ml-2 px-2 py-1 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              Add Category
            </button>

            {cat.children?.length > 0 && (
              <button
                type="button"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
                }}
                className="ml-2 p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {isExpanded && cat.children?.length > 0 && (
            <div className="ml-4 mt-1 border-l border-gray-200 pl-3">
              {renderCategories(cat.children)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Our Categories</h2>
      </div>
      <div className="flex justify-end items-center gap-2 my-4">
        <Button
          onClick={() =>
            router.push("/dashboard/inventories/categorymanagement")
          }
        >
          Manage Category
        </Button>
        {loading && (
          <span className="text-sm text-gray-400 animate-pulse">
            Loading...
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Search our categories..."
        value={ourSearch}
        onChange={(e) => setOurSearch(e.target.value)}
        className="w-full mb-3 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
      />

      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
        {categories.length > 0 ? (
          renderCategories(categories)
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No categories found
          </p>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
