import React from "react";

const CategorySkeleton = ({ rows = 5 }) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between bg-gray-200 px-4 py-2 animate-pulse">
               <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Category
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Slug
        </div>
         <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Active
        </div>
         <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
         Action
        </div>
        
      </div>

      {/* Body Skeleton */}
      <div className="space-y-2 p-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-gray-100 animate-pulse rounded-md h-12 px-4"
          >
            <div className="flex items-center gap-2 w-1/4">
              <div className="bg-gray-300 h-4 w-6 rounded"></div>
              <div className="bg-gray-300 h-4 w-20 rounded"></div>
            </div>
            <div className="bg-gray-300 h-4 w-20 rounded"></div>
            <div className="bg-gray-300 h-4 w-10 rounded"></div>
            <div className="bg-gray-300 h-6 w-16 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySkeleton;
