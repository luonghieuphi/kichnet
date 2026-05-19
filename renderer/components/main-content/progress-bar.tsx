import React, { useEffect } from "react";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";
import { Sparkles } from "lucide-react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import useLogger from "../hooks/use-logger";

function ProgressBar({
  progress,
  doubleUpscaylCounter,
  batchMode,
  resetImagePaths,
}: {
  progress: string;
  doubleUpscaylCounter: number;
  batchMode: boolean;
  resetImagePaths: () => void;
}) {
  const [batchProgress, setBatchProgress] = React.useState(0);
  const t = useAtomValue(translationAtom);
  const logit = useLogger();

  useEffect(() => {
    const progressString = progress.trim().replace(/\n/g, "");
    // Remove trailing and leading spaces
    if (progressString.includes("Successful")) {
      setBatchProgress((prev) => prev + 1);
    }
  }, [progress]);

  const stopHandler = () => {
    window.electron.send(ELECTRON_COMMANDS.STOP);
    logit("🛑 Stopping Upscayl");
  };

  // const progressStyle = useMemo(() => {
  //   if (progress.includes("%")) {
  //     return {
  //       "--value": parseFloat(progress.replace("%", "")),
  //     };
  //   } else if (progress.includes("Success")) {
  //     return {
  //       "--value": 100,
  //     };
  //   }
  //   return {
  //     "--value": 0,
  //   };
  // }, [progress]);

  return (
    <div className="absolute z-50 flex h-full w-full flex-col items-center justify-center bg-base-300/50 backdrop-blur-lg">
      <div className="flex flex-col items-center gap-2 rounded-btn bg-base-100/50 p-4 backdrop-blur-lg">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center relative overflow-hidden shadow-lg shadow-secondary/15 animate-pulse">
          {/* Lớp texture tạo họa tiết khối */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
          {/* Icon lấp lánh */}
          <Sparkles className="text-white w-6 h-6 relative z-10" strokeWidth={1.5} />
        </div>

        <p className="rounded-full px-2 pb-2 font-bold">
          {batchMode &&
            `${t("APP.PROGRESS_BAR.BATCH_UPSCAYL_IN_PROGRESS_TITLE")} ${batchProgress}`}
        </p>

        <div className="flex flex-col items-center gap-1">
          {progress !== "Hold on..." ? (
            <p className="text-sm font-bold">
              {progress}
              {!batchMode &&
                doubleUpscaylCounter > 0 &&
                "\nPass " + doubleUpscaylCounter}
            </p>
          ) : (
            <p className="text-sm font-bold">{progress}</p>
          )}

          <p className="animate-pulse rounded-full px-2 pb-3 text-xs font-medium text-neutral-content/50">
            {t("APP.PROGRESS_BAR.IN_PROGRESS_TITLE")}
          </p>
        </div>

        <button onClick={stopHandler} className="btn btn-outline">
          {t("APP.PROGRESS_BAR.STOP_BUTTON_TITLE")}
        </button>
      </div>
    </div>
  );
}

export default ProgressBar;
