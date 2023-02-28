import React from "react";
export type ImageViewerProps = {
    imageUrl: string;
    width: number;
    height: number;
    scale: number;
    translateY: number;
    translateX: number;
    onRequestClose: () => unknown;
    loadCallback: (load: boolean) => unknown;
};
declare const ImageViewer: React.ForwardRefExoticComponent<ImageViewerProps & React.RefAttributes<unknown>>;
export default ImageViewer;
