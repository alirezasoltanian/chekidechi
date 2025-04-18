"use client";

import React from "react";
import Confetti from "react-confetti";

const ConfettiEffect: React.FC = () => {
  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
    />
  );
};

export default ConfettiEffect;
