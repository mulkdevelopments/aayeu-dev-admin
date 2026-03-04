"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* --- Stats Cards Skeleton --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {/* Title Skeleton */}
              <Skeleton className="h-5 w-32 rounded-md" />
              {/* Icon Skeleton */}
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              {/* Number Skeleton */}
              <Skeleton className="h-8 w-20 mt-2 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- Recent Orders Table Skeleton --- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold lg:text-3xl md:text-2xl text-xl">
            <Skeleton className="h-6 w-48 rounded-md" />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              {/* Table Header */}
              <thead className="bg-gray-100">
                <tr>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="px-4 py-2 text-left">
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {[1, 2, 3, 4, 5,6,7,8,9,10].map((i) => (
                  <tr key={i} className="border-b last:border-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
