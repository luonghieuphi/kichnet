import { translationAtom } from "@/atoms/translations-atom";
import { useCustomWidthAtom } from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import React, { useState, useEffect } from "react";

type ImageScaleSelectProps = {
  scale: string;
  setScale: React.Dispatch<React.SetStateAction<string>>;
  hideInfo?: boolean;
};

export function SelectImageScale({
  scale,
  setScale,
  hideInfo,
}: ImageScaleSelectProps) {
  const [useCustomWidth, setUseCustomWidth] = useAtom(useCustomWidthAtom);
  const t = useAtomValue(translationAtom);

  // Initialize showSlider if scale is not one of the standard buttons
  const [showSlider, setShowSlider] = useState(!["1", "2", "4", "8"].includes(scale));

  useEffect(() => {
    if (!["1", "2", "4", "8"].includes(scale)) {
      setShowSlider(true);
    }
  }, [scale]);

  const isActive = (val: string) => !useCustomWidth && scale === val && !showSlider;

  const handleSelectScale = (val: string) => {
    setUseCustomWidth(false);
    setShowSlider(false);
    setScale(val);
  };

  const handleSelectCustom = () => {
    setUseCustomWidth(false);
    setShowSlider(true);
  };

  if (hideInfo) {
    return (
      <div className="flex flex-col gap-2.5">
        {/* PREMIUM SLIDER CARD */}
        <div className="flex flex-col gap-3 rounded-[14px] bg-base-200 border border-base-content/10 p-4 select-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-base-content/65">
              {t("SCALE_LABEL" as any)}
            </span>
            <span className="text-sm font-bold text-primary">
              {scale}X
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={scale}
            onChange={(e: any) => {
              setUseCustomWidth(false);
              setScale(e.target.value.toString());
            }}
            step="1"
            className="custom-slider mt-1"
          />
        </div>

        {useCustomWidth && (
          <div className="text-xs text-warning/80 mt-1 bg-warning/5 px-3 py-2 rounded-xl border border-warning/10">
            ⚠️ Đang sử dụng <b>Chiều rộng tùy chỉnh (px)</b> cấu hình trong Cài đặt.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row items-center gap-2 mb-2">
        {hideInfo ? (
          <>
            <p className="text-sm font-semibold">
              {t("SETTINGS.IMAGE_SCALE.TITLE")}{" "}
              {!useCustomWidth && (
                <span className="text-xs font-semibold text-primary">
                  ({scale}X)
                </span>
              )}
            </p>
            {!useCustomWidth && parseInt(scale) >= 6 && (
              <span
                className="text-xs font-bold text-error cursor-help"
                data-tooltip-id="tooltip"
                data-tooltip-content={t("SETTINGS.IMAGE_SCALE.WARNING")}
              >
                <svg
                  className="h-4 w-4"
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.836 3.244c.963-1.665 3.365-1.665 4.328 0l8.967 15.504c.963 1.667-.24 3.752-2.165 3.752H3.034c-1.926 0-3.128-2.085-2.165-3.752ZM12 8.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 8.5Zm1 9a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"></path>
                </svg>
              </span>
            )}
          </>
        ) : (
          <p className="text-sm font-medium">
            {t("SETTINGS.IMAGE_SCALE.TITLE")} {!useCustomWidth && `(${scale}X)`}{" "}
            {useCustomWidth && "DISABLED"}
          </p>
        )}
      </div>

      {!hideInfo && (
        <p className="text-xs text-base-content/85 mb-3">
          {t("SETTINGS.IMAGE_SCALE.DESCRIPTION")}
        </p>
      )}
      {!hideInfo && !useCustomWidth && parseInt(scale) >= 6 && (
        <p className="text-xs text-base-content/85 text-red-500 mb-3">
          {t("SETTINGS.IMAGE_SCALE.ADDITIONAL_WARNING")}
        </p>
      )}

      {/* Button group matching mockup */}
      <div className="flex flex-row gap-2 mt-2">
        {["2", "4", "8"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSelectScale(s)}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
              isActive(s)
                ? "bg-[#5D5FEF] border-[#5D5FEF] text-white shadow-lg shadow-[#5D5FEF]/30"
                : "bg-base-200 border-white/5 text-base-content/80 hover:bg-base-300 hover:border-white/10"
            }`}
          >
            {s}x
          </button>
        ))}


        <button
          type="button"
          onClick={handleSelectCustom}
          className={`flex-1 h-11 flex items-center justify-center rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
            showSlider && !useCustomWidth
              ? "bg-[#5D5FEF] border-[#5D5FEF] text-white shadow-lg shadow-[#5D5FEF]/30"
              : "bg-base-200 border-white/5 text-base-content/80 hover:bg-base-300 hover:border-white/10"
          }`}
        >
          Tùy chỉnh
        </button>
      </div>

      {/* Old range slider (1 to 16) displayed inside premium container */}
      {showSlider && !useCustomWidth && (
        <div className="mt-3 animate-step-in flex flex-col gap-2 bg-base-200/50 p-3 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-base-content/75 font-semibold">
              Kéo để thay đổi tỷ lệ
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {scale}X
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={scale}
            onChange={(e: any) => {
              setScale(e.target.value.toString());
            }}
            step="1"
            className="custom-slider mt-1"
          />
        </div>
      )}

      {useCustomWidth && (
        <div className="text-xs text-warning/80 mt-2 bg-warning/5 px-3 py-2 rounded-xl border border-warning/10">
          ⚠️ Đang sử dụng <b>Chiều rộng tùy chỉnh (px)</b> cấu hình trong Cài đặt.
        </div>
      )}
    </div>
  );
}

