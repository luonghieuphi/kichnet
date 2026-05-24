import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useMemo } from "react";
import { Tooltip } from "react-tooltip";
import { themeChange } from "theme-change";
import useLogger from "../../hooks/use-logger";
import {
  savedOutputPathAtom,
  progressAtom,
  rememberOutputFolderAtom,
  scaleAtom,
  customWidthAtom,
  useCustomWidthAtom,
} from "../../../atoms/user-settings-atom";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useToast } from "@/components/ui/use-toast";
import { translationAtom } from "@/atoms/translations-atom";
import { SelectImageScale } from "../settings-tab/select-image-scale";
import SelectModelDialog from "./select-model-dialog";
import { ImageFormat } from "@/lib/valid-formats";
import { Folder, Sparkles } from "lucide-react";

interface IProps {
  selectImageHandler: () => Promise<void>;
  selectFolderHandler: () => Promise<void>;
  upscaylHandler: () => Promise<void>;
  batchMode: boolean;
  setBatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  imagePath: string;
  doubleUpscayl: boolean;
  setDoubleUpscayl: React.Dispatch<React.SetStateAction<boolean>>;
  dimensions: {
    width: number | null;
    height: number | null;
  };
  setSaveImageAs: React.Dispatch<React.SetStateAction<ImageFormat>>;
  setGpuId: React.Dispatch<React.SetStateAction<string>>;
  resetImagePaths: () => void;
  batchFolderPath?: string;
}

function UpscaylSteps({
  selectImageHandler,
  selectFolderHandler,
  upscaylHandler,
  batchMode,
  setBatchMode,
  imagePath,
  doubleUpscayl,
  setDoubleUpscayl,
  dimensions,
  resetImagePaths,
  batchFolderPath,
}: IProps) {
  const [scale, setScale] = useAtom(scaleAtom);
  const [outputPath, setOutputPath] = useAtom(savedOutputPathAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const rememberOutputFolder = useAtomValue(rememberOutputFolderAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);

  const logit = useLogger();
  const { toast } = useToast();
  const t = useAtomValue(translationAtom);

  const outputHandler = async () => {
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FOLDER);
    if (path !== null) {
      logit("🗂 Setting Output Path: ", path);
      setOutputPath(path);
    } else {
      setOutputPath(null);
    }
  };

  useEffect(() => {
    themeChange(false);
  }, []);

  const upscaylResolution = useMemo(() => {
    const newDimensions = {
      width: dimensions.width,
      height: dimensions.height,
    };

    let doubleScale = parseInt(scale) * parseInt(scale);
    let singleScale = parseInt(scale);

    if (doubleUpscayl) {
      if (useCustomWidth) {
        newDimensions.width = customWidth;
        newDimensions.height = Math.round(
          customWidth * (dimensions.height / dimensions.width),
        );
      } else {
        const newWidth = dimensions.width * doubleScale;
        const newHeight = dimensions.height * doubleScale;
        newDimensions.width = newWidth;
        newDimensions.height = newHeight;
      }
    } else {
      if (useCustomWidth) {
        newDimensions.width = customWidth;
        newDimensions.height = Math.round(
          customWidth * (dimensions.height / dimensions.width),
        );
      } else {
        newDimensions.width = dimensions.width * singleScale;
        newDimensions.height = dimensions.height * singleScale;
      }
    }

    return newDimensions;
  }, [dimensions.width, dimensions.height, doubleUpscayl, scale]);

  return (
    <div
      className={`animate-step-in animate flex h-screen flex-col gap-7 overflow-y-auto overflow-x-hidden p-5 scrollbar-none`}
    >
      {/* STEP 1: PROCESSING TYPE */}
      <div className="animate-step-in group flex flex-col gap-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center rounded-[6px] border border-info/30 bg-info/10 px-1.5 py-0.5 text-[11px] font-bold text-info select-none">
            01
          </div>
          <p
            className="step-heading !mb-0 leading-none cursor-help"
            data-tooltip-id="tooltip"
            data-tooltip-content={t("APP.BATCH_MODE.DESCRIPTION")}
          >
            {t("APP.PROCESSING_TYPE.TITLE")}
          </p>
        </div>
        <button
          className="flex items-center justify-between w-full rounded-[14px] bg-base-200 border border-base-content/10 py-3.5 px-4 text-left transition-all hover:bg-base-300 active:scale-[0.98] cursor-pointer group select-none focus:outline-none"
          onClick={() => {
            if (!rememberOutputFolder) setOutputPath("");
            setProgress("");
            setBatchMode(!batchMode);
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
              {t("APP.BATCH_MODE.LABEL" as any) || "LỰA CHỌN CHẾ ĐỘ"}
            </span>
            <span className="text-sm font-bold text-base-content leading-tight">
              {batchMode ? t("APP.BATCH_MODE.TITLE") : t("APP.BATCH_MODE.SINGLE")}
            </span>
          </div>
          <div className="h-7 w-7 rounded-full bg-base-300/50 flex items-center justify-center transition-transform group-hover:rotate-180">
            <span className="text-xs">🔄</span>
          </div>
        </button>
      </div>

      {/* STEP 2 */}
      <div className="animate-step-in group flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex items-center justify-center rounded-[6px] border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary select-none">
              02
            </div>
            <p className="step-heading !mb-0 leading-none">{t("APP.MODEL_SELECTION.TITLE")}</p>
          </div>

          <SelectModelDialog />
        </div>
      </div>

      {/* STEP 3: RESOLUTION PARAMS */}
      <div className="animate-step-in group flex flex-col gap-4">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="flex items-center justify-center rounded-[6px] border border-info/30 bg-info/10 px-1.5 py-0.5 text-[11px] font-bold text-info select-none">
            03
          </div>
          <p className="step-heading !mb-0 leading-none">{t("RESOLUTION_PARAMS" as any)}</p>
        </div>
        <SelectImageScale scale={scale} setScale={setScale} hideInfo />
      </div>

      {/* STEP 4 */}
      <div className="animate-step-in flex flex-col gap-2.5">
        {/* STEP 4 HEADER */}
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="flex items-center justify-center rounded-[6px] border border-success/30 bg-success/10 px-1.5 py-0.5 text-[11px] font-bold text-success select-none">
            04
          </div>
          <p className="step-heading !mb-0 leading-none">{t("APP.OUTPUT_PATH_SELECTION.TITLE")}</p>
        </div>

        {/* PREMIUM OUTPUT CARD BUTTON */}
        <button
          className="flex items-center justify-between w-full rounded-[14px] bg-base-200 border border-base-content/10 py-3.5 px-4 text-left transition-all hover:bg-base-300 active:scale-[0.98] cursor-pointer group select-none focus:outline-none"
          data-tooltip-content={outputPath || undefined}
          data-tooltip-id="tooltip"
          onClick={outputHandler}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <Folder className="h-4 w-4 text-base-content/40 flex-shrink-0" />
            <span className="text-sm font-bold text-base-content truncate">
              {outputPath ? outputPath : t("APP.OUTPUT_PATH_SELECTION.LOCAL_WORKSPACE")}
            </span>
          </div>
          <span
            className={`badge text-[10px] font-bold px-2.5 py-1 rounded-[6px] select-none whitespace-nowrap flex-shrink-0 h-auto ${
              outputPath
                ? "bg-success/10 text-success border border-success/20"
                : "bg-white/[0.04] text-white/50 border border-white/[0.08]"
            }`}
          >
            {outputPath
              ? t("APP.OUTPUT_PATH_SELECTION.CUSTOM_BADGE")
              : t("APP.OUTPUT_PATH_SELECTION.DEFAULT_BADGE")}
          </span>
        </button>
      </div>

      {/* STEP 4 */}
      <div className="animate-step-in mt-1">
        {dimensions.width && dimensions.height && (
          <div className="mb-3.5 flex flex-col gap-1.5 px-4 py-3.5 bg-[#121320]/45 border border-white/5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md">
            <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">
              {t("APP.SCALE_SELECTION.TITLE")}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75 mt-1 select-none leading-none">
              <span className="font-mono text-base-content/60">
                {dimensions.width} x {dimensions.height}
              </span>
              <span className="text-base-content/30 font-normal text-xs mx-1">→</span>
              <span className="font-mono font-extrabold text-[#8b5cf6] drop-shadow-[0_0_8px_rgba(139,92,246,0.25)]">
                {upscaylResolution.width} x {upscaylResolution.height}
              </span>
            </div>
          </div>
        )}

        <button
          className="w-full h-12 rounded-xl text-base font-extrabold text-white bg-gradient-to-r from-[#ff5e00] to-[#ff9200] hover:from-[#e55400] hover:to-[#e58300] border-none transition-all duration-200 active:scale-95 shadow-lg shadow-orange-500/25 mt-1 group cursor-pointer flex items-center justify-center"
          onClick={
            progress.length > 0 || !outputPath
              ? () =>
                toast({
                  description: t(
                    "APP.SCALE_SELECTION.NO_OUTPUT_FOLDER_ALERT",
                  ),
                })
              : upscaylHandler
          }
        >
          {progress.length > 0 ? (
            <span className="flex items-center justify-center gap-1.5">
              {t("APP.SCALE_SELECTION.IN_PROGRESS_BUTTON_TITLE")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              {t("APP.SCALE_SELECTION.START_BUTTON_TITLE")}
            </span>
          )}
        </button>

        {(imagePath || (batchMode && batchFolderPath)) && (
          <button
            onClick={resetImagePaths}
            className="btn btn-outline btn-neutral w-full h-11 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 mt-3 group flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {batchMode
              ? t("APP.SELECT_DIFFERENT_FOLDER" as any) || "Chọn lại thư mục khác"
              : t("APP.SELECT_DIFFERENT_IMAGE" as any) || "Chọn ảnh khác"}
            <span className="inline-block transition-transform duration-300 group-hover:rotate-180">🔄</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default UpscaylSteps;
