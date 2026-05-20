import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";
import React from "react";
import { Image, Settings } from "lucide-react";

type TabsProps = {
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
};

const Tabs = ({ selectedTab, setSelectedTab }: TabsProps) => {
  const t = useAtomValue(translationAtom);

  return (
    <div className="tabs-boxed tabs mx-5 mb-2">
      <a
        className={`tab gap-2 ${selectedTab === 0 && "tab-active"}`}
        onClick={() => {
          setSelectedTab(0);
        }}
      >
        <Image className="h-4 w-4" />
        {t("OVERVIEW")}
      </a>
      <a
        className={`tab gap-2 ${selectedTab === 1 && "tab-active"}`}
        onClick={() => {
          setSelectedTab(1);
        }}
      >
        <Settings className="h-4 w-4" />
        {t("AI_PARAMETERS")}
      </a>
    </div>
  );
};

export default Tabs;
