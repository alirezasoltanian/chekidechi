import { useRef, useState, useEffect } from "react";
import { MathUtils } from "three/src/math/MathUtils.js";

import s from "./play.module.scss";
import { getUser } from "@/actions/user";
import { useChatStore } from "@/basketball/store/chat";

type PlayProps = {
  startGame: () => void;
};

type MouseTouchEvent = MouseEvent | TouchEvent;

export const Play = ({ startGame }: PlayProps) => {
  const isClicking = useRef(false);
  const clickPosition = useRef<{ x: number; y: number }>();
  const [user, setUser] = useState();
  const [timeRemaining, setTimeRemaining] = useState();

  const currentPosition = useRef({ x: 0, y: 0 });
  const [slideY, setSlideY] = useState(0);
  const { userBaleInfo } = useChatStore();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser(userBaleInfo.id.toString());

      setUser(user);
      const updatedAt = new Date(user.updatedAt);
      const now = new Date();
      const timeDiff = Math.floor((now.getTime() - updatedAt.getTime()) / 1000); // in seconds
      if (timeDiff < 1 * 60) {
        setTimeRemaining(1 * 60 - timeDiff);
      } else {
        setTimeRemaining(null);
      }
    };
    fetchUser();
  }, [userBaleInfo]);
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
  // Swipe up logics
  useEffect(() => {
    if (!user) return;
    if (timeRemaining !== null) return;
    const onMouseDown = (e: MouseTouchEvent) => {
      isClicking.current = true;
      const mouse = "touches" in e ? e.touches[0] : e; // Check for touch events
      clickPosition.current = { x: mouse.clientX, y: mouse.clientY };
      currentPosition.current = { ...clickPosition.current };
    };

    const onMouseUp = (e: MouseTouchEvent) => {
      isClicking.current = false;

      if (clickPosition.current) {
        const mouse = "changedTouches" in e ? e.changedTouches[0] : e; // Check for touch events
        const finalPosition = {
          x: clickPosition.current.x - mouse.clientX,
          y: clickPosition.current.y - mouse.clientY,
        };

        if (Math.abs(finalPosition.y) > 0.02) startGame();
      }
    };

    const onMouseMove = (e: MouseTouchEvent) => {
      if (isClicking.current && clickPosition.current) {
        const mouse = "touches" in e ? e.touches[0] : e; // Check for touch events
        currentPosition.current = { x: mouse.clientX, y: mouse.clientY };

        const posY = MathUtils.lerp(
          currentPosition.current.y - clickPosition.current.y,
          0,
          0.6
        );

        setSlideY(posY);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchstart", onMouseDown);
    document.addEventListener("touchend", onMouseUp);
    document.addEventListener("touchmove", onMouseMove);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchend", onMouseUp);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, [startGame, timeRemaining]);

  return (
    <div className={s.start}>
      {!user ? (
        <div className="absolute inset-0 m-auto animate-spin text-5xl">🎮</div>
      ) : timeRemaining !== null ? (
        <div className={s.play}>زمان باقی‌مانده: {timeRemaining} ثانیه</div>
      ) : (
        <div
          className={s.wrapper}
          style={{ transform: `translateY(${slideY}px)` }}
        >
          <div className={s.ball}></div>
          <div className={s.play}>برای بازی بالا بکش</div>
          {/* <div className={s.play}>Swipe up to play</div> */}
        </div>
      )}
    </div>
  );
};
