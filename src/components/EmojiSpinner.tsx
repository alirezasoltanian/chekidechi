"use client";

import React, { useEffect, useRef, useState } from "react";
// import { emojis } from '../utils/emojiList'
import { getUser, updateUserTokens } from "@/actions/user";
import { User } from "@/db/schema";
import { toast } from "sonner";
import ConfettiEffect from "./ConfettiEffect";
import styles from "./EmojiSpinner.module.css";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/basketball/store/chat";
import { Button } from "./ui/button";
// import { validateInitData } from "@/utils/validateInitData";

// آرایه جدید تخفیف‌ها را تعریف می‌کنیم
const discounts = [
  { discountId: "discount1", value: "100" },
  { discountId: "", value: "پوچ" },
  { discountId: "discount3", value: "40" },
  { discountId: "", value: "پوچ" },
  { discountId: "discount5", value: "30" },
  { discountId: "", value: "پوچ" },
  { discountId: "discount7", value: "55" },
  { discountId: "", value: "پوچ" },
  { discountId: "discount11", value: "50" },
  { discountId: "discount12", value: "50" },
  { discountId: "discount13", value: "40" },
  { discountId: "discount14", value: "30" },
  { discountId: "discount15", value: "20" },
  { discountId: "", value: "پوچ" },
];

// Bale WebApp type definitions

type UserBaleInfo = {
  username: string;
  id: string | number;
  first_name: string;
  allows_write_to_pm: boolean;
};

// Add an import statement for the audio file
// const sliceChangeSound = new Audio("/audios/ring.mp3");

const EmojiSpinner: React.FC = () => {
  const [numSlices] = useState(12);
  const [loading, setLoading] = useState(true);

  const [winner, setWinner] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<{
    discountId: string;
    value: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const isSpinning = useRef(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { userBaleInfo, setUserBaleInfo } = useChatStore();
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const failSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      successSoundRef.current = new Audio("/audios/success.mp3");
      failSoundRef.current = new Audio("/audios/fail.mp3");
    }
  }, []);
  useEffect(() => {
    if (loading) return;
    createSpinner();
  }, [loading]);

  useEffect(() => {
    if (!userBaleInfo || user) return;
    async function getUserFunction() {
      setLoading(true);
      try {
        const userId = String(userBaleInfo.id);
        const user = await getUser(userId);
        setUser(user);
      } catch (error) {
        console.error("Error in getUserFunction:", error);
      }
      setLoading(false);
    }
    getUserFunction();
  }, [userBaleInfo]);

  useEffect(() => {
    if (user) {
      const now = new Date();
      const updatedAt = new Date(user.updatedAt);
      const timeDiff = Math.floor((now.getTime() - updatedAt.getTime()) / 1000); // in seconds
      if (timeDiff < 5 * 60) {
        setTimeRemaining(5 * 60 - timeDiff);
      } else {
        setTimeRemaining(null);
      }
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

  const randInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const createSpinner = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = "";

    const rr = randInt(55, 255);
    const gg = randInt(55, 255);
    const bb = randInt(55, 255);

    const percentC = 100 / numSlices;
    const ang = 270 - percentC * 1.8;
    const cx = 50;
    const cy = 50;
    const r = 25;
    const sw = 30;
    const startAngle = (ang * Math.PI) / 180;
    const angle = (percentC / 100) * (2 * Math.PI);
    const x = cx + r * Math.cos(startAngle + angle);
    const y = cy + r * Math.sin(startAngle + angle);
    const largeArc = percentC > 50 ? 1 : 0;
    const d = `M ${cx + r * Math.cos(startAngle)} ${
      cy + r * Math.sin(startAngle)
    } A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;

    const slicesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    slicesGroup.classList.add("slicesHere");

    for (let i = 0; i < numSlices; i++) {
      const sliceColor = `rgb(${((i + 1) * rr) % 255}, ${
        ((i + 1) * gg) % 255
      }, ${((i + 1) * bb) % 255})`;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute(
        "transform",
        `rotate(${(360 / numSlices) * i} ${cx} ${cy})`
      );
      g.classList.add("slice");
      g.setAttribute("data-value", i.toString());

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", d);
      path.setAttribute("stroke", sliceColor);
      path.setAttribute("stroke-width", sw.toString());
      path.setAttribute("fill", "none");

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", "50");
      text.setAttribute("y", "15");
      text.setAttribute("font-size", "5");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");

      const discountIndex = i % discounts.length;
      const discountValue = discounts[discountIndex]?.value || "";
      text.textContent = discountValue;

      g.appendChild(path);
      g.appendChild(text);
      slicesGroup.appendChild(g);
    }

    svg.appendChild(slicesGroup);

    const spinner = document.createElementNS("http://www.w3.org/2000/svg", "g");
    spinner.classList.add("spinner");
    spinner.innerHTML =
      '<circle cx="50" cy="50" r="8" /><path d="M50 38 l 2 5 h-4z" fill="#000" />';
    svg.appendChild(spinner);
  };

  const spin = () => {
    if (isSpinning.current) return;

    isSpinning.current = true;
    setWinner(null);
    setSelectedDiscount(null);

    const totalRotation = randInt(1440, 2160); // 4-6 full rotations
    const duration = 5000; // 5 seconds
    const startTime = Date.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = async () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentRotation = totalRotation * easedProgress;
      const slicesGroup = svgRef.current?.querySelector(".slicesHere");
      if (slicesGroup) {
        slicesGroup.setAttribute(
          "transform",
          `rotate(${-currentRotation} 50 50)`
        );
      }

      if (progress < 1) {
        // Calculate the current slice index
        const sliceAngle = 360 / numSlices;
        const normalizedRotation = (currentRotation % 360) + sliceAngle / 2;
        const currentSliceIndex =
          Math.floor(normalizedRotation / sliceAngle) % numSlices;

        // Play sound when the slice changes

        animationRef.current = requestAnimationFrame(animate);
      } else {
        const finalRotation = totalRotation % 360;
        const sliceAngle = 360 / numSlices;
        const normalizedRotation = (finalRotation + sliceAngle / 2) % 360;
        const winnerIndex =
          Math.floor(normalizedRotation / sliceAngle) % numSlices;

        const winningDiscount = discounts[winnerIndex % discounts.length];

        if (winningDiscount && user?.chatId) {
          if (winningDiscount.discountId) {
            setWinner(winnerIndex);
            const selectedValue = Number(winningDiscount.value);
            setUserBaleInfo({
              ...userBaleInfo,
              token: userBaleInfo?.token + Number(winningDiscount.value),
            });
            setSelectedDiscount(winningDiscount);
            if (successSoundRef.current) {
              successSoundRef.current.currentTime = 0; // Reset sound to start
              successSoundRef.current.play(); // Play sound
            }

            const response = await updateUserTokens(user.chatId, selectedValue);
            if (response.data) {
              toast.success(`توکن شما با موفقیت ${selectedValue} افزایش یافت`);
            } else {
              toast.error("خطایی رخ داده است");
            }
          } else {
            if (winningDiscount) {
              setSelectedDiscount(winningDiscount);
            }
            if (user.chatId) {
              if (failSoundRef.current) {
                failSoundRef.current.currentTime = 0; // Reset sound to start
                failSoundRef.current.play();
              }
              await updateUserTokens(user.chatId, 0);
            }
          }

          setTimeRemaining(5 * 60);
        }

        isSpinning.current = false;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleButtonClick = () => {
    // Handle button click logic here
    spin();
  };

  if (loading || !userBaleInfo)
    return <div className="animate-spin text-5xl">🎮</div>;
  if (!user && !loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg font-medium text-red-600 bg-red-100 px-4 py-2 rounded-lg shadow-md">
          کاربر یافت نشد
        </p>
      </div>
    );

  return (
    <div>
      <div className="text-center mb-6 absolute top-12 left-0 right-0 mx-auto">
        <h3 className="text-xl  font-bold text-primary">
          {userBaleInfo?.first_name
            ? `${userBaleInfo.first_name} عزیز، خوش آمدید`
            : "کاربر عزیز، خوش آمدید"}
        </h3>
      </div>

      <div className={styles.spinnerContainer}>
        <svg
          id="c"
          viewBox="0 0 100 100"
          ref={svgRef}
          onClick={() => {
            if (timeRemaining === null) {
              spin();
            }
          }}
          className={cn(
            timeRemaining === null && "cursor-pointer",
            styles.spinner
          )}
        ></svg>
        {/* <div className={styles.controls}>
          <label htmlFor="slices">تعداد گزینه‌ها:</label>
          <input
            type="number"
            id="slices"
            value={numSlices}
            onChange={(e) => setNumSlices(Number(e.target.value))}
            min={2}
            max={discounts.length}
          />
        </div> */}
        {selectedDiscount && (
          <div className={styles.selectedDiscount}>
            {selectedDiscount.discountId ? (
              <h3 className={styles.discountValue}>
                تبریک شما برنده {selectedDiscount.value} تعداد توکن شدید
              </h3>
            ) : (
              <h3 className={styles.noDiscount}>
                متأسفانه این بار شانس با شما یار نبود!
              </h3>
            )}
          </div>
        )}
        {winner !== null && <ConfettiEffect />}
        <div className="mt-4 flex justify-center">
          {timeRemaining !== null ? (
            <p className="text-lg font-medium text-amber-600 bg-amber-100 px-4 py-2 rounded-lg shadow-md animate-pulse">
              زمان باقی‌مانده: {timeRemaining} ثانیه
            </p>
          ) : (
            <Button
              className="text-2xl font-bold p-4 py-2!"
              onClick={handleButtonClick}
            >
              کلیک کنید
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmojiSpinner;
