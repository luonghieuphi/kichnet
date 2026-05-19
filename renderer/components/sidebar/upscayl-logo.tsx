import { Sparkles } from "lucide-react";
import useTranslation from "../hooks/use-translation";

const UpscaylLogo = () => {
  const t = useTranslation();

  return (
    <div className="fixed right-2 top-2 z-50 flex items-center justify-center gap-2 rounded-[7px] bg-base-300 px-2 py-1 font-medium text-base-content ">
      <div className="w-5 h-5 rounded bg-gradient-to-br from-[#00c6ff] to-[#0072ff] flex items-center justify-center relative overflow-hidden">
        {/* Icon lấp lánh */}
        <Sparkles className="text-white w-3 h-3 relative z-10 animate-pulse" strokeWidth={1.5} />
      </div>
      {t("TITLE")}
    </div>
  );
};

export default UpscaylLogo;

