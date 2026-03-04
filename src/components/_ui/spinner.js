"use client";

export const Spinner = ({ className }) => {
  return (
    <div className={`w-10 h-10 border-4 border-yellow-600 border-dashed rounded-full animate-spin ${className}`}></div>
  );
};
