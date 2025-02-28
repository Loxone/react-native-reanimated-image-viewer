import React from "react";
import { ImageURISource } from "react-native";
export type ImageViewerProps = {
    source: ImageURISource | number;
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
