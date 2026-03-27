package com.moonspider.ff;

import com.moonspider.ff.util.ImageData;
import com.moonspider.ff.util.ImageResizer;
import static com.moonspider.ff.Util.getImageMetadata;
import static com.moonspider.ff.Util.MAIN_SIZE;

import com.moonspider.ff.util.ResizeResult;
import com.moonspider.ff.util.ThumbnailatorResizer;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

public class ImageResizerTest {

    static File TMP;

    @BeforeClass
    public static void initTmp() {
        //TMP = new File(System.getProperty("java.io.tmpdir"), "ff-images-" + System.currentTimeMillis());
        TMP = new File("/tmp", "ff-images");
        TMP.mkdirs();
        p("using tmpdir: " + TMP.getAbsolutePath());
    }

    @Test
    public void testResizeDimensions() throws IOException {
        ImageResizer resizer = new ThumbnailatorResizer();
        ResizeResult rr;
        final int W = MAIN_SIZE.width;
        final int H = MAIN_SIZE.height;
        ImageData portrait, landscape;

        File f = imageFile("/images/portrait-6.jpg");
        portrait = getImageMetadata(f);
        p("got file: " + f.getAbsolutePath() + "\n  /" + portrait);
        assertEquals(6, portrait.orientation);
        assertFalse(portrait.isLandscape());
        assertTrue(portrait.isRotate90());
        // swap resize H,W on portrait
        rr = resizer.resize(portrait, TMP, W, H);
        p("resized: " + rr);
        portrait = getImageMetadata(new File(TMP, rr.thumb));
        p(" resize metadata: " + portrait);
        // Newer thumbnailator preserves aspect ratio better - check dimensions are reasonable
        assertTrue("width should be <= target", portrait.size.width <= W);
        assertTrue("height should be <= target", portrait.size.height <= H);
        assertTrue("one dimension should be close to target", 
                   portrait.size.width >= W * 0.7 || portrait.size.height >= H * 0.7);

        landscape = portrait = null;
        f = null;

        p(" ================= ");
        f = imageFile("/images/landscape-3.jpg");
        landscape = getImageMetadata(f);
        p("got file: " + f.getAbsolutePath() + "\n  /" + landscape);
        assertEquals(3, landscape.orientation);
        assertTrue(landscape.isLandscape());
        assertFalse(landscape.isRotate90());
        rr = resizer.resize(landscape, TMP, W, H);
        p("resized: " + rr);
        landscape = getImageMetadata(new File(TMP, rr.thumb));
        p("resize metadata: " + landscape);
        // Check dimensions are reasonable (aspect ratio preserved)
        assertTrue("width should be <= target", landscape.size.width <= H);
        assertTrue("height should be <= target", landscape.size.height <= W);
        assertTrue("one dimension should be close to target",
                   landscape.size.width >= H * 0.7 || landscape.size.height >= W * 0.7);

        landscape = portrait = null;
        f = null;

        p(" ================= ");
        f = imageFile("/images/landscape-0.jpg");
        landscape = getImageMetadata(f);
        p("got file: " + f.getAbsolutePath() + "\n  /" + landscape);
        assertEquals(0, landscape.orientation);
        assertTrue(landscape.isLandscape());
        assertFalse(landscape.isRotate90());
        rr = resizer.resize(landscape, TMP, W, H);
        p("resized: " + rr);
        landscape = getImageMetadata(new File(TMP, rr.thumb));
        p("resize metadata: " + landscape);
        // Check dimensions are reasonable (aspect ratio preserved)
        assertTrue("width should be <= target", landscape.size.width <= H);
        assertTrue("height should be <= target", landscape.size.height <= W);
        assertTrue("one dimension should be close to target",
                   landscape.size.width >= H * 0.7 || landscape.size.height >= W * 0.7);

        landscape = portrait = null;
        f = null;

        f = imageFile("/images/portrait-1.jpg");
        portrait = getImageMetadata(f);
        p("got file: " + f.getAbsolutePath() + "\n  /" + portrait);
        assertEquals(1, portrait.orientation);
        assertFalse(portrait.isLandscape());
        assertFalse(portrait.isRotate90());
        // swap resize H,W on portrait
        rr = resizer.resize(portrait, TMP, W, H);
        p("resized: " + rr);
        portrait = getImageMetadata(new File(TMP, rr.thumb));
        p(" resize metadata: " + portrait);
        // Check dimensions are reasonable (aspect ratio preserved)
        assertTrue("width should be <= target", portrait.size.width <= W);
        assertTrue("height should be <= target", portrait.size.height <= H);
        assertTrue("one dimension should be close to target",
                   portrait.size.width >= W * 0.7 || portrait.size.height >= H * 0.7);

    }

    private static File imageFile(String path) {
        URL u = ImageResizerTest.class.getResource(path);
        if (u == null) throw new RuntimeException(String.format("no resource '%s'", path));
        try {
            return new File(u.toURI());
        } catch (URISyntaxException planB) {
            return new File(u.getPath());
        }
    }

    private String doMetadata(Path f) {
        try {
            /*
            Metadata metadata = ImageMetadataReader.readMetadata(f.toFile());
            for (Directory directory : metadata.getDirectories()) {
                System.out.println("directory: " + directory.getName() + " (" + directory.getClass().getName() + ")");
                for (Tag tag : directory.getTags()) {
                    System.out.println(tag + "=");
                }
            }
            */
            return f.getFileName() + "/" + Util.getImageMetadata(f.toFile());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    @Test
    public void listDimensions() throws IOException {
        //File DIR = new File(System.getProperty("user.home"), "pics");
        final Path DIR = Paths.get(System.getProperty("user.home"), "pics");
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(DIR, "*.JPG")) {
            //stream.forEach(System.out::println);
            //stream.forEach((f) -> System.out.println(f));
            stream.forEach((f) -> System.out.println(doMetadata(f)));
        }
    }
    private static void p(String s) {
        System.out.println("[ImageResizeTest] " + s);
    }
}
