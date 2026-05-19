import React, { useEffect, useState } from "react";

const SelectTheme = ({ hideLabel }: { hideLabel?: boolean }) => {
  const [activeTheme, setActiveTheme] = useState("upscayl");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "upscayl";
    setActiveTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {!hideLabel && (
        <p className="text-sm font-semibold text-base-content/85">Giao diện</p>
      )}
      <div className="flex flex-row gap-2.5">
        <button
          type="button"
          onClick={() => handleThemeChange("upscayl")}
          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
            activeTheme === "upscayl"
              ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/20"
              : "bg-base-200 border-base-content/10 text-base-content/60 hover:bg-base-300 hover:text-base-content/80"
          }`}
        >
          Tối
        </button>
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
            activeTheme === "light"
              ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/20"
              : "bg-base-200 border-base-content/10 text-base-content/60 hover:bg-base-300 hover:text-base-content/80"
          }`}
        >
          Sáng
        </button>
      </div>
    </div>
  );
};

export default SelectTheme;
