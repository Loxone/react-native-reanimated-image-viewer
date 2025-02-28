import React from "react";
export type ImageViewerProps = {
    imageUrl: string;
    width: number;
    height: number;
    scale: number;
    translateY: number;
    translateX: number;
    onRequestClose: () => void;
    loadCallback: (load: boolean) => void;
    repositionCallback: (repositon: boolean) => void;
    onLoadingFailed: (e: Error) => void;
};
export type ImageViewerRef = {
    incScale: () => void;
    decScale: () => void;
    getImageData: () => {
        translateX: number;
        translateY: number;
        scale: number;
        width: number;
        height: number;
    };
};
declare const ImageViewer: React.ForwardRefExoticComponent<ImageViewerProps & React.RefAttributes<ImageViewerRef>>;
export default ImageViewer;
