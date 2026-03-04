import React from "react";

const InventorySkeleton = ({ rows = 5 }) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 w-full">
      {/* Header Skeleton with Labels */}
      <div className="flex items-center bg-gray-200 px-4 py-2 gap-2">
        <div className="h-6 w-32 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Name
        </div>
        <div className="h-6 w-28 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Category
        </div>
        <div className="h-6 w-24 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Brand
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Gender
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Price
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Stock
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Min Price
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Max Price
        </div>
        <div className="h-6 w-24 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Country
        </div>
        <div className="h-6 w-16 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Action
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="space-y-2 p-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-gray-100 animate-pulse rounded-md h-12 px-4 gap-2"
          >
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
            <div className="h-4 w-28 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventorySkeleton;
