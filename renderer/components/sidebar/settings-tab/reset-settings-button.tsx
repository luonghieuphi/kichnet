import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";
import React from "react";

export function ResetSettingsButton({
  hideLabel = false,
}: {
  hideLabel?: boolean;
}) {
  const t = useAtomValue(translationAtom);
  return (
    <button
      className="w-full py-3 px-4 rounded-xl border border-error/20 bg-error/5 text-error text-sm font-bold transition-all duration-200 hover:bg-error/10 active:scale-[0.98] cursor-pointer text-center"
      onClick={async () => {
        localStorage.clear();
        alert(t("SETTINGS.RESET_SETTINGS.ALERT"));
      }}
    >
      {t("SETTINGS.RESET_SETTINGS.BUTTON_TITLE")}
    </button>
  );
}
