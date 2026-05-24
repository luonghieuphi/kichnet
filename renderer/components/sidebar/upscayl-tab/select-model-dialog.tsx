"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { ModelId, MODELS } from "@common/models-list";
import { useAtom, useAtomValue } from "jotai";
import { selectedModelIdAtom } from "@/atoms/user-settings-atom";
import { customModelIdsAtom } from "@/atoms/models-list-atom";
import useTranslation from "@/components/hooks/use-translation";
import posthog from "posthog-js";

const SelectModelDialog = () => {
  const t = useTranslation();
  const [selectedModelId, setSelectedModelId] = useAtom(selectedModelIdAtom);

  const customModelIds = useAtomValue(customModelIdsAtom);
  const [open, setOpen] = useState(false);

  const handleModelSelect = (model: ModelId | string) => {
    setSelectedModelId(model);
    setOpen(false);

    posthog.capture("model_selected", {
      $ip: "0.0.0.0",
      $geoip_disable: true,
      model,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center justify-between w-full rounded-[14px] bg-base-200 border border-base-content/10 py-3.5 px-4 text-left transition-all hover:bg-base-300 active:scale-[0.98] cursor-pointer group select-none focus:outline-none">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                {t("APP.MODEL_SELECTION.LABEL")}
              </span>
              <span className="text-sm font-bold text-base-content leading-tight">
                {selectedModelId in MODELS
                  ? t(
                      `APP.MODEL_SELECTION.MODELS.${MODELS[selectedModelId]?.id}.NAME` as any,
                    )
                  : selectedModelId}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-base-content/40 transition-transform group-hover:translate-y-0.5" />
          </button>
        </DialogTrigger>
        <DialogContent className="z-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("APP.MODEL_SELECTION.DESCRIPTION")}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-2">
            <div className="flex flex-col gap-2">
              {Object.entries(MODELS).map((modelData) => {
                const modelId = modelData[0] as ModelId;
                const isSelected = selectedModelId === modelId;
                return (
                  <button
                    key={modelId}
                    className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-base-200/50 border-white/5 text-base-content hover:bg-base-200 hover:border-white/10"
                    }`}
                    onClick={() => handleModelSelect(modelId)}
                  >
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="font-bold text-sm leading-none">
                        {t(`APP.MODEL_SELECTION.MODELS.${modelId}.NAME`)}
                      </span>
                      <span className={`text-[11px] font-medium leading-tight ${isSelected ? "text-primary/70" : "text-base-content/50"}`}>
                        {t(`APP.MODEL_SELECTION.MODELS.${modelId}.DESCRIPTION`)}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse ml-3 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {customModelIds.length > 0 && (
                <p className="font-bold text-[10px] text-base-content/40 uppercase tracking-widest mt-4 mb-1 px-1">
                  {t("APP.MODEL_SELECTION.IMPORTED_CUSTOM_MODELS")}
                </p>
              )}
              {customModelIds.map((customModel) => {
                const isSelected = selectedModelId === customModel;
                return (
                  <button
                    key={customModel}
                    className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-base-200/50 border-white/5 text-base-content hover:bg-base-200 hover:border-white/10"
                    }`}
                    onClick={() => handleModelSelect(customModel)}
                  >
                    <span className="font-bold text-sm">{customModel}</span>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectModelDialog;
