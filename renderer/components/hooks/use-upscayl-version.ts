import { useState, useEffect } from "react";

const useUpscaylVersion = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const match = navigator?.userAgent?.match(
      /(?:Sharpix AI|sharpix-ai|Upscayl)\/([\d\.]+\d+)/i,
    );
    const upscaylVersion = match ? match[1] : "2.15.0";
    setVersion(upscaylVersion);
  }, []);

  return version;
};

export default useUpscaylVersion;
