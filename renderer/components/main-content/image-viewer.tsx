import { sanitizePath } from "@common/sanitize-path";

const ImageViewer = ({
  imagePath,
  setDimensions,
  zoomAmount,
}: {
  imagePath: string;
  setDimensions: (dimensions: { width: number; height: number }) => void;
  zoomAmount: string;
}) => {
  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      <img
        src={"file:///" + sanitizePath(imagePath)}
        onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
          setDimensions({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
          });
        }}
        draggable="false"
        alt=""
        style={{
          objectFit: "contain",
          transform: `scale(${parseFloat(zoomAmount) / 100})`,
          transformOrigin: "center center",
        }}
        className="h-full w-full transition-transform duration-300"
      />
    </div>
  );
};

export default ImageViewer;
