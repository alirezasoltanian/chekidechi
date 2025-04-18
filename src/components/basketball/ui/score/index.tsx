import React, { useMemo, useEffect, useState } from "react";
import s from "./score.module.scss";
import { useShootingStore } from "@/basketball/store/use-shooting-store";
import { settings } from "@/basketball/lib/config";
import { updateUserTokens } from "@/actions/user";
import { useChatStore } from "@/basketball/store/chat";
import {
  getUserRankInLeaderboard,
  upsertLeaderboardEntry,
} from "@/actions/game";

type ScoreProps = {
  restartGame: () => void;
};

export const Score = ({ restartGame }: ScoreProps) => {
  const { remainingTime, makes, totalShots } = useShootingStore();
  const { userBaleInfo, setUserBaleInfo } = useChatStore();
  const [rank, setRank] = useState<number>(0);

  // به جای تصادفی بودن، تصمیم گرفتم یک پیام ثابت برای هر دقیقه تنظیم کنم.
  const chooseMessage = useMemo(() => {
    return new Date().getMinutes() % 2 === 0 ? 1 : 0;
  }, []);

  // Update tokens when game is over
  useEffect(() => {
    console.log("userBaleInfo111", userBaleInfo);
    const updateTokens = async () => {
      if (remainingTime === 0) {
        console.log("userBaleInfo", userBaleInfo);
        const response = await updateUserTokens(
          userBaleInfo.id.toString(),
          makes * 10
        );
        setUserBaleInfo({
          ...userBaleInfo,
          token: userBaleInfo?.token + makes * 10,
        });
      }
      const leaderboardResponse = await upsertLeaderboardEntry({
        chatId: userBaleInfo.id,
        username: userBaleInfo.username || "کاربر ناشناس",
        name: "basketball",
        score: makes,
        time: settings.gameTime - remainingTime,
        tokens: makes * 10,
      });
      if (leaderboardResponse.action !== "unchanged") {
        const leaderboard = await getUserRankInLeaderboard(
          userBaleInfo?.id.toString() || "",
          "basketball"
        );
        if (leaderboard.success && !!leaderboard.rank && makes > 0) {
          setRank(leaderboard.rank);
        }
      }
    };

    updateTokens();
  }, []);

  let message: string[];

  switch (true) {
    // case remainingTime === 0:
    //   message = ["زمانتان به پایان رسید", "زمانتان به پایان رسید"];
    //   break;

    case makes === 10:
      message = ["آیا شما کری هستید؟", "کری، این تویی؟"];
      break;

    case makes < 10 && makes >= 8:
      message = ["تقریباً عالی!", "تقریباً رسیدی!"];
      break;

    case makes < 8 && makes >= 6:
      message = ["هدف‌گیری خوب!", "عالی بود!"];
      break;

    case makes < 6 && makes >= 4:
      message = ["بد نبود", "ادامه بده"];
      break;

    case makes < 4 && makes >= 1:
      message = ["دفعه بعد شانس بهتری داری", "خیلی سخت بود :("];
      break;

    case makes === 0:
    default:
      message = ["اوپس، دوباره تلاش کن", "بعدا دوباره تلاش کن"];
      break;
  }

  const time = settings.gameTime - remainingTime;
  const parts = time.toFixed(1).split(".");

  // if (!userBaleInfo) return null;
  return (
    <div className={s.score}>
      <div className={s.wrapper}>
        <div className={s.box}>
          <h2>{message[chooseMessage]}</h2>
          {rank === 1 ? (
            <h2>ترکوندی ها تو نفر اول شدی 🥇</h2>
          ) : rank === 2 ? (
            <h2>
              عالی بود! تو نفر دوم شدی! فقط یک قدم تا قهرمانی فاصله داری! 🥈
            </h2>
          ) : rank === 3 ? (
            <h2>خوش به حالت! تو نفر سوم شدی! ادامه بده و به قله برس! 🥉</h2>
          ) : (
            rank > 3 &&
            makes > 0 && (
              <h2>
                رتبه شما: {rank} - هنوز هم عالی بازی کردی! به تلاش ادامه بده!
              </h2>
            )
          )}
          {!!makes && (
            <p
              style={{ padding: "10px" }}
              className="font-base text-lg bg-gradient-to-r p-[10px]  from-indigo-500 to-purple-600 rounded-xl"
            >
              شما {makes * 10} توکن به دست آوردید
            </p>
          )}
          <ul className={s.results}>
            <li className={s.balls}>
              <span></span>
              <p>
                {makes}
                <small>/{totalShots}</small>
              </p>
            </li>

            <li className={s.time}>
              <span></span>
              <p>
                {parts.map((part, index) => (
                  <React.Fragment key={index}>
                    {index === 0 && part}
                    {index === 1 && <small>.{part}ثانیه</small>}
                  </React.Fragment>
                ))}
              </p>
            </li>
          </ul>
        </div>

        <button onClick={restartGame} className={s.restart}>
          بازی مجدد
        </button>
      </div>
    </div>
  );
};
