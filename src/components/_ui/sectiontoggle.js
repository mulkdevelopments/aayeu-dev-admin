"use client";
import React from "react";

export default function SectionToggle({ sectionActive, handleToggle }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      {/* Hidden input */}
      <input
        type="checkbox"
         checked={sectionActive}
        onChange={handleToggle}
        className="sr-only peer"
      />

      {/* Track */}
      <div
        className="w-14 h-8 bg-gray-400 rounded-full peer-focus:outline-none 
        peer-checked:bg-green-500 transition-all duration-300"
      ></div>

      {/* Knob */}
      <div
        className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md 
        transform transition-transform duration-300 peer-checked:translate-x-6"
      ></div>
    </label>
  );
}
