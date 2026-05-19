import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";
import React from "react";
import { UploadCloud } from "lucide-react";

interface IProps {
  version: string;
  batchMode: boolean;
  selectImageHandler: () => void;
  selectFolderHandler: () => void;
}

function InstructionsCard({
  version,
  batchMode,
  selectImageHandler,
  selectFolderHandler,
}: IProps) {
  const t = useAtomValue(translationAtom);

  return (
    <div
      onClick={batchMode ? selectFolderHandler : selectImageHandler}
      className="group flex flex-col items-center justify-center w-full max-w-[45rem] h-[26rem] rounded-[28px] border-2 border-dashed border-[#5D5FEF]/20 bg-[#0a0b10] bg-gradient-to-b from-[#0a0b10] to-[#141122]/30 p-8 select-none text-center cursor-pointer transition-all duration-300 hover:border-[#5D5FEF]/45 hover:bg-[#0c0d15] active:scale-[0.99]"
    >
      {/* Upload icon circle */}
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#5D5FEF]/10 border border-[#5D5FEF]/20 shadow-[0_0_30px_rgba(93,95,239,0.05)] mb-7 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#5D5FEF]/15 group-hover:border-[#5D5FEF]/30 relative">
        <UploadCloud className="h-10 w-10 text-[#8b5cf6] transition-transform duration-300 group-hover:-translate-y-0.5" />
      </div>

      {/* Main Title */}
      <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">
        {t("APP.RIGHT_PANE_INFO.INPUT_DATA_SETUP")}
      </h2>

      {/* Description */}
      <p className="text-sm text-base-content/50 max-w-[28rem] leading-relaxed mb-7">
        {t("APP.RIGHT_PANE_INFO.INPUT_DATA_DESCRIPTION")}
      </p>

      {/* Format badges */}
      <div className="flex items-center justify-center gap-2.5">
        {["JPG", "PNG", "WEBP"].map((format) => (
          <span
            key={format}
            className="border border-white/5 bg-white/[0.02] text-[10px] uppercase font-bold tracking-wider text-base-content/40 px-3.5 py-1.5 rounded-[8px]"
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  );
}

export default InstructionsCard;
