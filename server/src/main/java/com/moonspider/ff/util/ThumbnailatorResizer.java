package com.moonspider.ff.util;

import net.coobird.thumbnailator.Thumbnails;

import java.io.File;
import java.io.IOException;

public class ThumbnailatorResizer extends ImageResizer {

    @Override
    public ResizeResult resize(ImageData data, File outDir, String prefix,
                               int width, int height, boolean preserveAspect) throws IOException {
        /* hacky, but just keep original WxH (e.g., 60x80) naming in resizing, since client assumes it */
        final int origWidth = width;
        final int origHeight = height;
        // swap w,h if EXIF data says it's rotated 90 or 270 degrees...
        if (data.isRotate90()) {
            int tmp = width;
            width = height;
            height = tmp;
        }
        // ...if it happens to be landscape, also swap (yes, potentially swap back)
        if (data.isLandscape()) {
            int tmp = width;
            width = height;
            height = tmp;
        }
        ResizeResult ret = result(data.imageFile.getName(), origWidth, origHeight);
        ret.thumb = prefix + ret.thumb;
        Thumbnails.of(data.imageFile)
                .outputQuality(1.0d)
                .useExifOrientation(true)
                //.width(width)
                //.height(height)
                .size(width, height)
                .keepAspectRatio(preserveAspect)
                .toFile(new File(outDir, ret.thumb));
        return ret;
    }
}
