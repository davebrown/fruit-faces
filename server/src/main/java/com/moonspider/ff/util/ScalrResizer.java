package com.moonspider.ff.util;

import org.imgscalr.Scalr;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ScalrResizer extends ImageResizer {

    @Override
    public ResizeResult resize(File full, File outDir, String prefix, int width, int height)
            throws IOException {
        ResizeResult ret = result(full.getName(), width, height);
        ret.thumb = prefix + ret.thumb;
        BufferedImage fullImage = ImageIO.read(full);
        BufferedImage thumbImage = Scalr.resize(fullImage, Scalr.Method.QUALITY,
                Scalr.Mode.AUTOMATIC, width, height, Scalr.OP_ANTIALIAS);
        ImageIO.write(thumbImage, "jpg", new File(outDir, ret.thumb));
        return ret;
    }
}
