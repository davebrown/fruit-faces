package com.moonspider.ff.util;

import org.imgscalr.Scalr;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ScalrResizer extends ImageResizer {

    @Override
    public ResizeResult resize(ImageData data, File outDir, String prefix, int width, int height, boolean preserveAspect)
            throws IOException {
        ResizeResult ret = result(data.imageFile.getName(), width, height);
        ret.thumb = prefix + ret.thumb;
        BufferedImage fullImage = ImageIO.read(data.imageFile);
        BufferedImage thumbImage = Scalr.resize(fullImage, Scalr.Method.QUALITY,
                Scalr.Mode.AUTOMATIC, width, height, Scalr.OP_ANTIALIAS);
        ImageIO.write(thumbImage, "jpg", new File(outDir, ret.thumb));
        return ret;
    }
}
