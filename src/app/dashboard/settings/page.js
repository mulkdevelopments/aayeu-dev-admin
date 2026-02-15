"use client";

import React, { useState } from "react";

import Link from "next/link";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { actions, settingsCards } from "@/utils/constants";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackfillSizeDialog from "@/components/_dialogs/BackfillSizeDialog";

const Page = () => {
  const [backfillOpen, setBackfillOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-y-auto">
      <CustomBreadcrumb />

      <h1 className="text-3xl font-bold mt-4 mb-8">Editorials</h1>

      <div className="border border-gray-300 rounded-2xl p-4 bg-white shadow-sm">

        <div className="space-y-3">
          {/* Backfill size card - opens dialog instead of linking */}
          <div className="flex items-center justify-between rounded-xl border border-gray-300 p-3 hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg flex items-center justify-center bg-slate-100">
                <Database className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800">Backfill size</div>
                <div className="text-sm text-gray-500">
                  Recompute normalized_size and size_country for all variants
                </div>
              </div>
            </div>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setBackfillOpen(true)}
            >
              Run backfill
            </Button>
          </div>

          {[...settingsCards, ...actions].map((card, index) => (
            <Link
              key={card.href || `card-${index}`}
              href={card.href}
              className="flex items-center justify-between rounded-xl border border-gray-300 p-3 hover:bg-gray-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg flex items-center justify-center">
                  {card.icon}
                </div>

                <div>
                  <div className="font-medium text-gray-800">
                    {card.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {card.description}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 text-sm font-medium rounded-lg hover:opacity-90 transition bg-blue-600 text-white">
                View
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BackfillSizeDialog open={backfillOpen} onClose={() => setBackfillOpen(false)} />

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"> */}
        {/* {settingsCards.map((card) => (
          <Link key={card.id} href={card.href}>
            <div
              className={`flex items-center gap-3 p-4 ${card.bgColor} ${card.textColor} 
              rounded-2xl shadow-xl cursor-pointer transform transition duration-200 overflow-hidden`}
            >
              <div
                className={`p-4 ${card.iconBg} rounded-full flex items-center justify-center`}
              >
                {card.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <p className="text-sm opacity-70">{card.description}</p>
              </div>
            </div>
          </Link>
        ))} */}

       
      {/* </div> */}
    </div>
  );
};

export default Page;
