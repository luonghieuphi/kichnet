import { newsAtom, showNewsModalAtom } from "@/atoms/news-atom";
import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";

function Footer() {
  const setShowNewsModal = useSetAtom(showNewsModalAtom);
  const news = useAtomValue(newsAtom);
  const t = useAtomValue(translationAtom);

  return (
    <div className="p-2 text-center text-xs text-base-content/50">
      {news && !news?.data?.dontShow && (
        <button
          className="badge badge-neutral mb-2"
          onClick={() => setShowNewsModal(true)}
        >
          {t("FOOTER.NEWS_TITLE")}
        </button>
      )}

    </div>
  );
}

export default Footer;
