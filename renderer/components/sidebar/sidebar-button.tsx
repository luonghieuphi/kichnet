import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import React from "react";

const SidebarToggleButton = ({
  showSidebar,
  setShowSidebar,
}: {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <button
      className={cn(
        "group fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center w-11 h-14 rounded-r-2xl bg-[#141521] border-y border-r border-white/10 shadow-[4px_0_20px_rgba(0,0,0,0.4)] hover:bg-[#1c1d2d] hover:border-primary/30 hover:w-12 active:scale-95 transition-all duration-300 cursor-pointer",
        showSidebar ? "hidden" : "",
      )}
      onClick={() => setShowSidebar((prev) => !prev)}
    >
      <ChevronRightIcon className="h-6 w-6 text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:scale-105" />
    </button>
  );
};

export default SidebarToggleButton;
