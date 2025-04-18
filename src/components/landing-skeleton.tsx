import React from "react";
import { Card, CardContent } from "./ui/card";

function LandingSkeleton() {
  return (
    <div className="container px-6 lg:px-8 py-8 rtl">
      {/* Title Skeleton */}
      <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />

      {/* User Info Card Skeleton */}
      <Card className="rounded-xl p-6 mb-8 bg-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="space-y-4 w-full md:w-1/2">
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="bg-gray-200 rounded-lg p-4 mt-4 md:mt-0 w-full md:w-1/3">
            <div className="h-6 w-1/2 mx-auto bg-gray-300 rounded-lg animate-pulse mb-2" />
            <div className="h-8 w-2/3 mx-auto bg-gray-300 rounded-lg animate-pulse" />
          </div>
        </div>
      </Card>

      {/* Games Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="block">
            <CardContent className="relative">
              {/* Image Skeleton */}
              <div className="relative h-48 w-full bg-gray-200 animate-pulse" />

              {/* Content Skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-6 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LandingSkeleton;
