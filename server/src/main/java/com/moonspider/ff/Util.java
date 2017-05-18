package com.moonspider.ff;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifDirectoryBase;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.jpeg.JpegDirectory;
import com.drew.metadata.png.PngDirectory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.moonspider.ff.client.FBService;
import com.moonspider.ff.client.TagService;
import com.moonspider.ff.model.UserDTO;
import com.moonspider.ff.util.ImageData;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;

import java.awt.*;
import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.TimeZone;

import static org.apache.commons.io.FilenameUtils.getExtension;

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

    public static File getTmpdir(String child) {
        File ret = new File(TMPDIR, child);
        ret.mkdirs();
        return ret;
    }

    public static final Dimension MAIN_SIZE = new Dimension(480, 640);
    public static final Dimension THUMB_SIZE = new Dimension(60, 80);
    public static final Dimension ML_SIZE = new Dimension(28, 28);

    private static File initTmpDir() {
        File ret = new File(System.getProperty("java.io.tmpdir", "/tmp"), "ff-tmp");
        ret.mkdirs();
        return ret;
    }

    // FIXME: since EXIF timestamps don't carry timezone, this would need to be specified by uploader
    private static final TimeZone PACIFIC_TIME = TimeZone.getTimeZone("America/Los_Angeles");

    public static ImageData getImageMetadata(File image) throws IOException {
        ImageData ret = new ImageData(image);
        Metadata metadata;
        int width = -1, height = -1;
        try {
            metadata = ImageMetadataReader.readMetadata(image);
        } catch (ImageProcessingException ipe) {
            throw new RuntimeException("cannot read " + image.getName(), ipe);
        }

        String ext = getExtension(image.getName());
        if (ext != null) ext = ext.toLowerCase();
        if ("png".equalsIgnoreCase(ext)) {
            Directory dir = metadata.getFirstDirectoryOfType(PngDirectory.class);
            if (dir != null && dir.containsTag(PngDirectory.TAG_IMAGE_WIDTH) && dir.containsTag(PngDirectory.TAG_IMAGE_HEIGHT)) {
                width = dir.getInteger(PngDirectory.TAG_IMAGE_WIDTH);
                height = dir.getInteger(PngDirectory.TAG_IMAGE_HEIGHT);
            }
        } else {
            Directory dir = metadata.getFirstDirectoryOfType(JpegDirectory.class);
            if (dir != null && dir.containsTag(JpegDirectory.TAG_IMAGE_WIDTH) && dir.containsTag(JpegDirectory.TAG_IMAGE_HEIGHT)) {
                width = dir.getInteger(JpegDirectory.TAG_IMAGE_WIDTH);
                height = dir.getInteger(JpegDirectory.TAG_IMAGE_HEIGHT);
            }
        }

        Collection dirs = metadata.getDirectoriesOfType(ExifDirectoryBase.class);


        //Directory exif = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
        for (Object dif : dirs) {
            Directory exif = (Directory)dif;
            if (ret.timestamp == null) {
                ret.timestamp = exif.getDate(ExifDirectoryBase.TAG_DATETIME_ORIGINAL, PACIFIC_TIME);
                if (ret.timestamp == null) {
                    ret.timestamp = exif.getDate(ExifDirectoryBase.TAG_DATETIME, PACIFIC_TIME);
                } else {
                    // can be null; tstamp is nullable in DB
                }
            }

            if (exif.containsTag(ExifSubIFDDirectory.TAG_ORIENTATION)) {
                ret.orientation = exif.getInteger(ExifSubIFDDirectory.TAG_ORIENTATION);
            }
            // prefer JPEG or PNG reckoning of size, but if not present there, try from exif
            if (width == -1 || height == -1) {
                if (exif.containsTag(ExifSubIFDDirectory.TAG_IMAGE_WIDTH) && exif.containsTag(ExifSubIFDDirectory.TAG_IMAGE_HEIGHT)) {
                    width = exif.getInteger(ExifSubIFDDirectory.TAG_IMAGE_WIDTH);
                    height = exif.getInteger(ExifSubIFDDirectory.TAG_IMAGE_HEIGHT);
                }
            }
        }
        if (width == -1 || height == -1) {
            throw new IOException("no width/height information present on image");
        }
        ret.size = new Dimension(width, height);
        return ret;
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

    public static String thumbName(String base, Dimension dim, String fullName) {
        String thumbName = base + "_" + dim.width + "x" + dim.height + "_t." + getExtension(fullName).toLowerCase();
        return thumbName;
    }

    private final static File TMPDIR = initTmpDir();

    public static final ObjectMapper JSON = new ObjectMapper();
    static {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(UserDTO.class, new FBService.FBUserDeserializer());
        JSON.registerModule(module);
    }

    public static String toJSON(Object o) throws JsonProcessingException {
        return JSON.writeValueAsString(o);
    }

    public static <T> T fromJSON(String s, Class<T> c) throws IOException {
        return JSON.readValue(s, c);
    }

    public static TagService createTagService(FFConfiguration config) {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(config.getTagServiceUrl())
                .addConverterFactory(JacksonConverterFactory.create(Util.JSON))
                .build();

        return retrofit.create(TagService.class);
    }

}
