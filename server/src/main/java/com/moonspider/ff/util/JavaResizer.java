package com.moonspider.ff.util;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;

public class JavaResizer extends ImageResizer {

    @Override
    public ResizeResult resize(File full, File outDir, String prefix, int width, int height) throws Exception {
        ResizeResult ret = result(full.getName(), width, height);
        ret.thumb = prefix + ret.thumb;
        BufferedImage fullImage = ImageIO.read(full);
        BufferedImage thumbImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = thumbImage.createGraphics();
        g.setComposite(AlphaComposite.Src);
        g.drawImage(fullImage, 0, 0, width, height, null);
        g.dispose();
        ImageIO.write(thumbImage, "jpg", new File(outDir, ret.thumb));
        return ret;
    }
}
