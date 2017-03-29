package com.moonspider.ff.util;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import static org.apache.commons.io.FilenameUtils.getBaseName;
import static org.apache.commons.io.FilenameUtils.getExtension;
import static com.moonspider.ff.util.Util.emptyOrNull;

public abstract class ImageResizer {

    public ResizeResult resize(File full, File outDir, int width, int height) throws Exception {
        return resize(full, outDir, "", width, height);
    }
    public abstract ResizeResult resize(File full, File outDir, String prefix, int width, int height) throws Exception;

    protected static String base(String filename) {
        return getBaseName(filename);
    }

    private static String ext(String filename) {
        return ext(filename);
    }

    protected static final List<String> VALID_EXTS = Arrays.asList("jpg", "png", "jpeg");

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
