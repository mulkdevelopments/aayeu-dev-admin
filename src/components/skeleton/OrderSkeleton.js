// OrdersSkeleton.js
import React from "react";

const OrdersSkeleton = ({ rows = 5 }) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between bg-gray-200 px-4 py-2 animate-pulse">
        <div className="h-6 w-8 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          #
        </div>
        <div className="h-6 w-24 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Order ID
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Amount
        </div>
        <div className="h-6 w-28 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Payment Status
        </div>
        <div className="h-6 w-28 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Order Status
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center">
          Actions
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="space-y-2 p-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-gray-100 animate-pulse rounded-md h-12 px-4"
          >
            <div className="h-4 w-6 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersSkeleton;
