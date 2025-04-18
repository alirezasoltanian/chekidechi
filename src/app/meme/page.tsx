"use client";
// https://github.com/avalynndev/memergez/tree/main
import MemeGenerator from "@/components/meme";
const MemePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-8">
      <header className="text-3xl flex items-center space-x-4">
        <h1>ساخت میم</h1>
      </header>
      <MemeGenerator />
    </div>
  );
};

export default MemePage;
