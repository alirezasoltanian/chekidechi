"use client";
import { Suspense, useEffect, useState } from "react";

import "../../basketball/css/reset.css";
import "../../basketball/css/global.scss";
import { Loading } from "@/components/basketball/ui/loading";
import { GameControl } from "@/basketball/logics/game-control";
import { AudioControl } from "@/basketball/logics/audio-control";
import { Experience } from "@/components/basketball/experience";
const App = () => {
  const [progress, setProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(true);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setIsLoadingComplete(true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <Suspense fallback={<Loading onProgress={(p) => setProgress(p)} />}>
      <div
        className="body-basketball"
        dir="ltr"
        style={{ visibility: isLoadingComplete ? "visible" : "hidden" }}
      >
        <GameControl />
        <Experience />
        <AudioControl />
      </div>
    </Suspense>
  );
};

export default App;
