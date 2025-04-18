"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { balloons } from "balloons-js";
import { differenceInSeconds } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScratchToReveal from "./ui/scratch-to-reveal";
import { checkResultGame, setStartedAtGame } from "@/actions/game";
import { useChatStore } from "@/basketball/store/chat";
import { User } from "@/db/schema";
// import { getUser } from "@/actions/user";

import AES from "crypto-js/aes";
const images = [
  "/images/jujutsu-game/11.jpg",
  "/images/jujutsu-game/12.jpg",
  "/images/jujutsu-game/13.jpg",
  "/images/jujutsu-game/14.jpg",
  "/images/jujutsu-game/15.jpg",
  "/images/jujutsu-game/16.jpg",
  "/images/jujutsu-game/17.jpg",
  "/images/jujutsu-game/18.jpg",
];

interface CardType {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemorizeGame() {
  const GAME_TIME = 60; // Time limit in seconds
  const [loading, setLoading] = useState(true);

  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [isComparing, setIsComparing] = useState(false);
  const [winToken, setWinToken] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [gameStatus, setGameStatus] = useState<
    "notStarted" | "playing" | "won" | "lost"
  >("notStarted");
  const [gameStarted, setGameStarted] = useState(false);
  const { userBaleInfo, setUserBaleInfo } = useChatStore();
  useEffect(() => {
    if (gameStarted) {
      resetGame();
    }
  }, [gameStarted]);
  useEffect(() => {
    if (!userBaleInfo) return;
    async function getUserFunc() {
      setLoading(true);
      try {
        // const user = await getUser(userId);
        setUser({ ...userBaleInfo, gameStartAt: null });
      } catch (error) {
        console.error("Error in getUserFunction:", error);
      }
      setLoading(false);
    }
    getUserFunc();
  }, [userBaleInfo]);
  useEffect(() => {
    async function getUserFunction() {
      const now = new Date();
      const updatedAt = new Date(user.updatedAt);
      const timeDiff = Math.floor((now.getTime() - updatedAt.getTime()) / 1000); // in seconds
      if (timeDiff < 60) {
        setTimeRemaining(60 - timeDiff);
      } else {
        setTimeRemaining(null);
      }
      if (user?.gameStartAt) {
        const startedAt = new Date(user.gameStartAt);
        const elapsedTime = differenceInSeconds(new Date(), startedAt);
        const remainingTime = GAME_TIME - elapsedTime;

        if (remainingTime <= 0) {
          const tokenRandom = Math.random().toString(36).substring(2);

          const encryptedTicketId = AES.encrypt(
            tokenRandom + "-lose" + "-0",
            "alsolop"
          ).toString();
          await checkResultGame({
            encryptedData: encryptedTicketId,
            chatId: userBaleInfo.id.toString(),
            initData: userBaleInfo.initData,
          });
          setGameStarted(false);
          setGameStatus("notStarted");
          setTimeLeft(0);
        } else {
          setTimeLeft(remainingTime);
          setGameStatus("playing");
          setGameStarted(true);
          resetGame();
        }
      }
    }
    if (user) {
      getUserFunction();
    }
  }, [user]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeRemaining !== null && timeRemaining > 0) {
        setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
      } else {
        setTimeRemaining(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (!user?.gameStartAt || gameStatus !== "playing") return;

    const startedAt = new Date(user.gameStartAt);

    const updateTimer = () => {
      const elapsedTime = differenceInSeconds(new Date(), startedAt);
      const remainingTime = Math.max(GAME_TIME - elapsedTime, 0);

      setTimeLeft(remainingTime);

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        setGameStatus("lost");

        // Generate encrypted token
        const tokenRandom = Math.random().toString(36).substring(2);
        const encryptedTicketId = AES.encrypt(
          `${tokenRandom}-lose-0`,
          "alsolop"
        ).toString();

        // Send game result
        checkResultGame({
          encryptedData: encryptedTicketId,
          chatId: userBaleInfo.id.toString(),
          initData: userBaleInfo.initData,
        });
      }
    };

    // Run initially
    updateTimer();

    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval); // Cleanup on unmount
  }, [user, gameStatus]);

  const resetGame = () => {
    const shuffledCards = [...images, ...images]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeLeft(GAME_TIME);
    setGameStatus("playing");
  };

  const handleCardClick = (id: number) => {
    if (gameStatus !== "playing" || isComparing) return;
    if (flippedCards.length === 2) return;
    if (cards[id].isMatched || cards[id].isFlipped) return;

    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedCards((prev) => [...prev, id]);

    if (flippedCards.length === 1) {
      setIsComparing(true); // Disable further clicks
      setMoves((moves) => moves + 1);
      const [firstCardId] = flippedCards;
      if (cards[firstCardId].emoji === cards[id].emoji) {
        // کارت‌ها مطابقت دارند
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === firstCardId || card.id === id
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFlippedCards([]);
        setIsComparing(false); // Enable clicks again
      } else {
        // کارت‌ها مطابقت ندارند، بعد از تاخیر برگردانده می‌شوند
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCardId || card.id === id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsComparing(false); // بعد از مقایسه، کلیک‌ها فعال شوند
        }, 1000); // تأخیر ۱ ثانیه برای نشان دادن کارت‌ها قبل از برگرداندن
      }
    }
  };

  useEffect(() => {
    if (
      cards.every((card) => card.isMatched) &&
      gameStatus === "playing" &&
      user
    ) {
      setGameStatus("won");
      const winTokenRandom = Math.floor(Math.random() * (15 - 3 + 1)) + 3;
      setWinToken(winTokenRandom);
      const tokenRandom = Math.random().toString(36).substring(2);

      // Sign the data (you can sign an object, then convert to JSON if needed)
      balloons();
      const encryptedTicketId = AES.encrypt(
        tokenRandom + "-won" + `-${winTokenRandom}`,
        process.env.NEXT_PUBLIC_GAME_SALT
      ).toString();
      setUserBaleInfo({
        ...userBaleInfo,
        token: userBaleInfo?.token + winTokenRandom,
      });
      async function checkResultGameHandler() {
        await checkResultGame({
          encryptedData: encryptedTicketId,
          chatId: userBaleInfo.id.toString(),
          initData: userBaleInfo.initData,
        });
      }
      checkResultGameHandler();
    }
  }, [cards, gameStatus]);
  if (loading || !userBaleInfo)
    return <div className="animate-spin text-5xl">🎮</div>;
  if (!user) return <div>کاربر یافت نشد</div>;
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      {!gameStarted ? (
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">بازی حافظه</h1>
          {timeRemaining !== null ? (
            <p className="text-lg font-medium text-amber-600 bg-amber-100 px-4 py-2 rounded-lg shadow-md animate-pulse">
              زمان باقی‌مانده: {timeRemaining} ثانیه
            </p>
          ) : (
            <Button
              onClick={async () => {
                setGameStarted(true);

                setUser({ ...user, gameStartAt: new Date() });
                await setStartedAtGame({
                  initData: userBaleInfo.initData,
                  chatId: userBaleInfo.id.toString(),
                });
                setTimeLeft(GAME_TIME);
              }}
              variant="secondary"
            >
              شروع بازی
            </Button>
          )}
        </div>
      ) : (
        <>
          <h1 className="mb-4 text-3xl font-bold">بازی حافظه</h1>
          {gameStatus === "playing" && (
            <div className="mb-4 grid grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card
                  key={card.id}
                  className={`relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden text-3xl transition-all duration-300 ${
                    card.isFlipped || card.isMatched
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                  onClick={() => handleCardClick(card.id)}
                >
                  {card.isFlipped || card.isMatched ? (
                    <div>
                      <Image
                        width={128}
                        height={128}
                        alt=""
                        className="absolute inset-0 size-full bg-cover"
                        src={card.emoji}
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </Card>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <div className="mb-2 text-xl">تعداد حرکت: {moves}</div>
            <div className="mb-4 text-xl">زمان باقی مانده: {timeLeft}</div>
          </div>
          {gameStatus === "won" && (
            <div className="flex flex-col items-center justify-center">
              <Image
                width={420}
                height={420}
                className="size-52 rounded-sm bg-cover"
                src="/images/jujutsu-game/bad/images1234.jpg"
                alt="lose image"
              />
              <div className="mb-4 text-2xl font-bold text-green-500">
                با {moves} حرکت برنده این بازی شدید جایزیتان را باز کنید
              </div>
              {winToken && (
                <div className="flex flex-col items-center justify-center">
                  بخراش
                  <ScratchToReveal
                    width={300}
                    height={100}
                    minScratchPercentage={70}
                    className="bg-background flex items-center justify-center overflow-hidden rounded-2xl"
                    //  onComplete={handleComplete}
                  >
                    تبریک شما برنده {winToken} توکن شدید
                  </ScratchToReveal>
                </div>
              )}
            </div>
          )}
          {gameStatus === "lost" && (
            <div className="flex flex-col items-center justify-center">
              <Image
                width={420}
                height={420}
                className="size-52 rounded-sm bg-cover"
                src="/images/jujutsu-game/bad/images1234.jpg"
                alt="lose image"
              />
              <div className="mb-4 text-2xl font-bold text-red-500">
                شما متاسفانه باختید
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
