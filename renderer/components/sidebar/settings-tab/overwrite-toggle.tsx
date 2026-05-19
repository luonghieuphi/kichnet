import { translationAtom } from "@/atoms/translations-atom";
import { overwriteAtom } from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

const OverwriteToggle = () => {
  const [overwrite, setOverwrite] = useAtom(overwriteAtom);
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between w-full rounded-xl bg-base-200 border border-base-content/10 py-3.5 px-4">
        <div className="flex flex-col gap-0.5 flex-1 pr-3">
          <span className="text-sm font-semibold text-base-content/85">
            Ghi đè hình ảnh cũ
          </span>
          <span className="text-[11px] text-base-content/50 leading-tight">
            Xử lý lại ảnh mới thay vì tải ảnh cũ có sẵn
          </span>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={overwrite}
          onChange={() => {
            setOverwrite((oldValue: boolean) => {
              const newValue = !oldValue;
              localStorage.setItem("overwrite", JSON.stringify(newValue));
              return newValue;
            });
          }}
        />
      </div>
    </div>
  );
};

export default OverwriteToggle;
