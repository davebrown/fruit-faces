package com.moonspider.ff.util;

import net.coobird.thumbnailator.Thumbnails;

import java.io.File;
import java.io.IOException;

public class ThumbnailatorResizer extends ImageResizer {

    @Override
    public ResizeResult resize(File full, File outDir, String prefix, int width, int height) throws IOException {
        ResizeResult ret = result(full.getName(), width, height);
        ret.thumb = prefix + ret.thumb;
        Thumbnails.of(full)
                .outputQuality(1.0d)
                .useExifOrientation(true)
                .size(width, height)
                .toFile(new File(outDir, ret.thumb));
        return ret;
    }
}
