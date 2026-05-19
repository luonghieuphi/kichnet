import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";

type ImageFormatSelectProps = {
  batchMode: boolean;
  saveImageAs: string;
  setExportType: (arg: string) => void;
};

export function SelectImageFormat({
  batchMode,
  saveImageAs,
  setExportType,
}: ImageFormatSelectProps) {
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex w-full flex-col gap-2.5">
      <p className="text-sm font-semibold text-base-content/85">
        Định dạng Đầu ra
      </p>
      <div className="flex flex-row gap-2.5">
        {["png", "jpg", "webp"].map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => setExportType(format)}
            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer text-center uppercase ${
              saveImageAs === format
                ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/20"
                : "bg-base-200 border-base-content/10 text-base-content/60 hover:bg-base-300 hover:text-base-content/80"
            }`}
          >
            {format}
          </button>
        ))}
      </div>
    </div>
  );
}
