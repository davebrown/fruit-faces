package com.moonspider.ff.util;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static org.apache.commons.io.FilenameUtils.getBaseName;
import static org.apache.commons.io.FilenameUtils.getExtension;
import static com.moonspider.ff.Util.emptyOrNull;

public abstract class ImageResizer {

    public ResizeResult resize(ImageData data, File outDir, int width, int height) throws IOException {
        return resize(data, outDir, "", width, height);
    }
    public ResizeResult resize(ImageData data, File outDir, int width, int height,
                               boolean preserveAspectRatio) throws IOException {
        return resize(data, outDir, "", width, height, preserveAspectRatio);
    }
    public ResizeResult resize(ImageData data, File outDir, String prefix, int width, int height)
            throws IOException {
        return resize(data, outDir, prefix, width, height, true);
    }
    public abstract ResizeResult resize(ImageData data, File outDir, String prefix, int width,
                                        int height, boolean preserveAspectRatio) throws IOException;

    protected static String base(String filename) {
        return getBaseName(filename);
    }

    private static String ext(String filename) {
        return ext(filename);
    }

    public static final List<String> VALID_EXTS = Arrays.asList("jpg", "png", "jpeg");

    protected static ResizeResult result(String full, int width, int height) {
        String ext = getExtension(full);
        if (emptyOrNull(ext)) {
            throw new IllegalArgumentException("no extension on file '" + full + "'");
        }
        ext = ext.toLowerCase();
        if (!VALID_EXTS.contains(ext)) {
            throw new IllegalArgumentException("invalid file extension on '" + full + "'");
        }
        ResizeResult ret = new ResizeResult();
        String base = base(full);
        ret.full(full).base(base).thumb(String.format("%s_%dx%d_t.%s", base, width, height, ext));
        return ret;
    }
}
