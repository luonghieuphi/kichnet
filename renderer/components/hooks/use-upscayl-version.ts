import { useState, useEffect } from "react";

const useUpscaylVersion = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    // @ts-ignore
    window.electron.invoke("get-app-version").then((v: string) => {
      setVersion(v.split(" ")[0]);
    }).catch(() => {
      const match = navigator?.userAgent?.match(
        /(?:Pixel UP|pixel-up|Sharpix AI|sharpix-ai|Upscayl)\/([\d\.]+\d+)/i,
      );
      const upscaylVersion = match ? match[1] : "1.0.5";
      setVersion(upscaylVersion);
    });
  }, []);

  return version;
};

export default useUpscaylVersion;
