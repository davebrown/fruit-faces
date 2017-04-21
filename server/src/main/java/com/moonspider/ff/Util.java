package com.moonspider.ff;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.*;
import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.TimeZone;

public class Util {

    private static final Logger log = LoggerFactory.getLogger(Util.class);
    public static void close(Closeable c) {
        if (c != null) {
            try {
                c.close();
            } catch (IOException ignore) {
                if (log.isDebugEnabled()) {
                    log.warn("problem closing " + c.getClass().getName() + ":", ignore);
                }
            }
        }
    }

    public static Throwable unwindExceptions(Throwable t) {
        int i = 0;
        while (t.getCause() != null && t.getCause() != t && ++i < 50) { // sanity check
            t = t.getCause();
        }
        return t;
    }

    public static boolean emptyOrNull(String s) {
        return s == null || "".equals(s);
    }

    public static File getTmpdir() {
        return TMPDIR;
    }

    public static final Dimension MAIN_SIZE = new Dimension(480, 640);
    public static final Dimension THUMB_SIZE = new Dimension(60, 80);

    private static File initTmpDir() {
        File ret = new File(System.getProperty("java.io.tmpdir", "/tmp"), "ff-tmp");
        ret.mkdirs();
        return ret;
    }

    // FIXME: since EXIF timestamps don't carry timezone, this would need to be specified by uploader
    private static final TimeZone PACIFIC_TIME = TimeZone.getTimeZone("America/Los_Angeles");

    public static Date getEXIFTimestamp(File image) throws IOException {
        Metadata metadata = null;
        try {
            metadata = ImageMetadataReader.readMetadata(image);
        } catch (ImageProcessingException ipe) {
            throw new RuntimeException("cannot read " + image.getName(), ipe);
        }
        Directory directory = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
        Date date = directory.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL, PACIFIC_TIME);
        if (date == null) {
            date = directory.getDate(ExifSubIFDDirectory.TAG_DATETIME, PACIFIC_TIME);
        }
        // can be null; tstamp is nullable in DB
        return date;
    }

    // same as FileUtils method of same name, but fails if dest file already exists
    public static void copyFileToDirectory(File src, File destDir) throws IOException {
        File destFile = new File(destDir, src.getName());
        if (destFile.exists())
            throw new IOException(destFile.getAbsolutePath() + " already exists");
        FileUtils.copyFile(src, destFile, true);
    }

    public static boolean deleteFiles(File dir, String... files) {
        boolean ret = true;
        for (String file : files) {
            ret |= new File(dir, file).delete();
        }
        return ret;
    }

    private final static File TMPDIR = initTmpDir();

    public static final ObjectMapper JSON = new ObjectMapper();
    public static String toJSON(Object o) throws JsonProcessingException {
        return JSON.writeValueAsString(o);
    }

    public static <T> T fromJSON(String s, Class<T> c) throws IOException {
        return JSON.readValue(s, c);
    }

}
