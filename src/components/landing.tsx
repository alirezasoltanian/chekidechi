"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useChatStore } from "@/basketball/store/chat";
import { Card, CardContent } from "./ui/card";
import LandingSkeleton from "./landing-skeleton";

function Landing() {
  const { userBaleInfo } = useChatStore();

  const games = [
    {
      id: "wheel",
      title: "گردونه شانس",
      description: "شانستو امتحان کن و توکن بگیر",
      imageUrl: "/images/wheel.png",
      path: "/wheel",
      disabled: false,
    },
    {
      id: "memorize",
      title: "بازی حافظه",
      description: "حافظتو به چالش بکش",
      imageUrl: "/images/memorize.jpg",
      path: "/memorize",
      disabled: false,
    },
    {
      id: "basketball",
      title: "بسکتبال",
      description: "بازی هیجان‌انگیز بسکتبال با امکان کسب امتیاز",
      imageUrl: "/images/basketball.jpg",
      path: "/basketball",
      disabled: false,
    },
    {
      id: "meme",
      title: "میم ساز",
      description: "میم بساز و به اشتراک بزار",
      imageUrl: "/images/meme.png",
      path: "/meme",
      disabled: false,
    },
  ];

  if (!userBaleInfo) {
    return <LandingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 rtl">
      <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
        بازی‌های سولوپ
      </h1>

      {userBaleInfo && (
        <Card className="  rounded-xl p-6 mb-8 bg-primary ">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">
                {userBaleInfo.first_name || userBaleInfo.username || "کاربر"}{" "}
                عزیز، خوش آمدید! 👋
              </h2>
              <p className="text-lg">
                امیدواریم از بازی‌های ما لذت ببرید و توکن‌های بیشتری جمع کنید.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4 md:mt-0 text-center">
              <p className="text-white text-lg">💰موجودی شما</p>
              <p className="text-white text-3xl font-bold">
                {userBaleInfo.token || 0} توکن
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="block">
            {game.disabled ? (
              <div className="bg-white h-[332px] rounded-xl overflow-hidden shadow-md relative">
                <div className="relative h-48 w-full bg-gray-100">
                  {!!game.imageUrl && (
                    <Image
                      src={game.imageUrl}
                      alt={game.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">
                    {game.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {game.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gray-900/30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className=" rotate-45  px-4 py-2 rounded-lg text-6xl font-bold text-gray-800/50">
                    به زودی
                  </span>
                </div>
              </div>
            ) : (
              <Link href={game.path} className="block">
                <CardContent className="relative ">
                  <div className="relative h-48 w-full bg-gray-100">
                    {game.imageUrl && (
                      <Image
                        src={game.imageUrl}
                        alt={game.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">
                      {game.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </CardContent>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Landing;
