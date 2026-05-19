import { FEATURE_FLAGS } from "@common/feature-flags";
import React from "react";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";

import { Sparkles } from "lucide-react";

export default function Header({ version }: { version: string }) {
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-4 select-none">
      <div className="relative group">
        {/* Subtle logo background glow */}
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-30 blur-[6px]" />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00c6ff] to-[#0072ff] flex items-center justify-center relative overflow-hidden border border-white/10 shadow-md">
          {/* Lớp texture tạo họa tiết khối */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
          {/* Icon lấp lánh */}
          <Sparkles className="text-white w-6 h-6 relative z-10 animate-pulse" strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="text-[22px] font-black tracking-wide text-base-content leading-tight">
          Pixel UP
        </h1>
        <span className="text-[10px] font-extrabold tracking-widest text-[#5D5FEF]/80 uppercase leading-none mt-1">
          VERSION 1.0
        </span>
      </div>
    </div>
  );
}

