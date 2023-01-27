import React from "react";
export type ImageViewerProps = {
    imageUrl: string;
    width: number;
    height: number;
    onRequestClose: () => unknown;
    sizeCallback: (translateX: number, translateY: number, scale: number, imageUrl: string) => unknown;
};
declare const ImageViewer: React.ForwardRefExoticComponent<ImageViewerProps & React.RefAttributes<unknown>>;
export default ImageViewer;
