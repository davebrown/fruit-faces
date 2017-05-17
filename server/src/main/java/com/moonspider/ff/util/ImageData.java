package com.moonspider.ff.util;

import java.awt.*;
import java.io.File;
import java.util.Date;

/** holder of all the EXIF data we're interested in */
public class ImageData {

    public ImageData(File baseImage) {
        imageFile = baseImage;
    }
    final public File imageFile;
    public int orientation = 0;
    public Date timestamp;
    public Dimension size;

    @Override
    public String toString() {
        return "ImageData{" +
                "orientation=" + orientation +
                ", timestamp=" + timestamp +
                ", size=" + size +
                ", landscape? " + isLandscape() +
                '}';
    }

    public boolean isLandscape() {
        // http://www.daveperrett.com/articles/2012/07/28/exif-orientation-handling-is-a-ghetto/
        // treat 0 (unspecified?) orientation same as 1
        if (orientation <= 4 && size.width >= size.height) return true;
        if (orientation > 4 && size.width < size.height) return true;
        return false;
    }

    // swap W and H on resize?
    public boolean isRotate90() {
        return orientation >= 4 && orientation <= 7;
    }
}
