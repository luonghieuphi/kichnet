import React, { useEffect, useState } from "react";
import { ShoppingCart, Wrench } from "lucide-react";

export default function TopBar() {
  const [remainingText, setRemainingText] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("pixelup_license_key") || localStorage.getItem("sharpix_license_key") || "";
    if (!key) {
      setRemainingText("");
      return;
    }

    const parts = key.trim().toUpperCase().split("-");
    const isPrefixValid = parts[0] === "SHARPIX" || parts[0] === "PIXELUP" || parts[0] === "PIXEL_UP" || parts[0] === "PIXEL";

    if (parts.length === 3) {
      setRemainingText("Vĩnh viễn");
      return;
    }

    let expiryStr = "";
    if (parts.length === 5 && isPrefixValid && parts[1] === "GEN") {
      expiryStr = parts[3];
    } else if (parts.length === 4 && isPrefixValid) {
      expiryStr = parts[2];
    } else {
      setRemainingText("Chưa kích hoạt");
      return;
    }

    if (expiryStr === "PERM") {
      setRemainingText("Vĩnh viễn");
      return;
    }

    let yy = 0, mm = 0, dd = 0, hh = 23, min = 59;
    if (expiryStr.length === 10) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
      hh = parseInt(expiryStr.slice(6, 8));
      min = parseInt(expiryStr.slice(8, 10));
    } else if (expiryStr.length === 8) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
      hh = parseInt(expiryStr.slice(6, 8));
    } else if (expiryStr.length === 6) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
    } else {
      setRemainingText("Mã không hợp lệ");
      return;
    }

    const expiryDate = new Date(2000 + yy, mm - 1, dd, hh, min, 59);
    const updateRemaining = () => {
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      
      if (diffTime <= 0) {
        setRemainingText("Hết hạn");
        return;
      }

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        setRemainingText(`${diffDays} ngày`);
      } else if (diffHours > 0) {
        setRemainingText(`${diffHours} giờ`);
      } else {
        setRemainingText(`${diffMinutes} phút`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 10000); // Kiểm tra mỗi 10 giây để nhảy phút nhạy hơn
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full flex items-center justify-end px-6 py-4 select-none z-40">
      {/* Background neon visual touch */}
      <div className="absolute top-0 right-[20%] w-[150px] h-[40px] bg-primary/5 rounded-full blur-[30px] pointer-events-none" />

      {/* Subscription status & Custom resource buttons */}
      <div className="flex items-center gap-3">
        {/* Capsule Wrapper */}
        <div className="flex items-center gap-3.5 px-4 py-2 bg-[#121320]/65 border border-white/5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-md">
          {/* Badge 1: License Remaining Days */}
          {remainingText && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-neutral-content/60 flex items-center gap-1">
                Bản quyền còn lại:{" "}
                <span className="font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  {remainingText}
                </span>
              </span>
            </div>
          )}

          {remainingText && (
            <div className="h-4 w-[1px] bg-white/10" />
          )}

          {/* Button 2: Kho tài nguyên AI */}
          <a
            href="https://docs.google.com/spreadsheets/d/1gf6VPHy9cFFZGaSdByLlhfy9N_MeSrXG9-_XpqStvWg/edit?gid=463213276#gid=463213276"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-bold text-neutral-content/90 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-primary" />
            Kho tài nguyên AI
          </a>

          {/* Button 3: Cài Photoshop, Corel */}
          <a
            href="https://docs.google.com/spreadsheets/d/1gf6VPHy9cFFZGaSdByLlhfy9N_MeSrXG9-_XpqStvWg/edit?gid=0#gid=0"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-bold text-neutral-content/90 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-primary" />
            Cài Photoshop, Corel
          </a>
        </div>
      </div>
    </div>
  );
}
