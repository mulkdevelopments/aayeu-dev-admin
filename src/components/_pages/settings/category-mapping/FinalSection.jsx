"use client";

import React from "react";

/**
 * FinalSection — preview + submit column
 * Props:
 * - finalCategoryData (object with Our Categories / Vendor Categories)
 * - onSubmit()
 * - isSubmitDisabled (boolean)
 */

const FinalSection = ({ finalCategoryData = {}, onSubmit, isSubmitDisabled }) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Final Mappings</h2>

      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
        {Object.keys(finalCategoryData).length ? (
          Object.entries(finalCategoryData).map(([cat, items]) => (
            <div key={cat} className="mb-3">
              <h3 className="font-semibold text-indigo-600 text-sm mb-1">{cat}</h3>
              <ul className="text-gray-700 text-sm list-disc list-inside space-y-1">
                {items.map((i, idx) => (
                  <li key={idx}>
                    {i.name}
                    {i.parent ? ` (under ${i.parent})` : ""}
                    {cat === "Vendor Categories" && i.product_count ? ` — ${i.product_count}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No mappings yet</p>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={`w-full py-2 mt-4 rounded-md text-white font-medium transition
              ${
                isSubmitDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 shadow-md"
              }`}
      >
        Submit Mappings
      </button>
    </div>
  );
};

export default FinalSection;
