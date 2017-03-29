package com.moonspider.ff.util;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.moonspider.ff.Util;

import java.io.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

import static org.apache.commons.io.FilenameUtils.getExtension;
import static org.apache.commons.io.FilenameUtils.getBaseName;

public class CompareThumbMethods {

    static final File THUMB_DIR = new File(System.getProperty("user.home"), "code/fruit-faces/thumbs");
    public static void main(String[] args) throws Exception {
        testThumbMethods();
    }

    /*
     * The net result of this experiment is that the tnator resizer, with max quality,
     * is better than either java or scalr
     */
    private static void testThumbMethods() throws Exception {
        final int WIDTH = 60, HEIGHT = 80;
        File[] jpgs = getMainJPGS();
        Calendar cal = Calendar.getInstance();
        cal.setTimeZone(TimeZone.getTimeZone("America/Los_Angeles"));
        //TimeZone.setDefault(
        for (File jpg : jpgs) {
            Date d = Util.getEXIFTimestamp(jpg);
            if (d != null) {
                cal.setTime(d);
                d = cal.getTime();
            }
            System.out.println(jpg.getName() + ": " + d);
        }
        final File dir = new File("/tmp/resize");
        dir.mkdirs();
        PrintWriter html = new PrintWriter(new FileWriter(new File(dir, "thumbs-" + WIDTH + "x" + HEIGHT + ".html")));
        html.write("<html><body>");
        Object[][] resizers = {
                { "java_", new JavaResizer() },
                { "scalr_", new ScalrResizer() },
                { "tnator_", new ThumbnailatorResizer() }
        };
        Map<String, List<ResizeResult>> map = new HashMap();
        Arrays.asList(jpgs).forEach(
                file -> map.put(getBaseName(file.getName()), new ArrayList<>())
        );
        for (Object[] row: resizers) {
            System.out.println("running " + row[0]);
            double start = System.currentTimeMillis();
            List<ResizeResult> res = resizeReport((ImageResizer)row[1], dir, html, (String)row[0], WIDTH, HEIGHT);
            System.out.printf("took %f seconds\n", (System.currentTimeMillis() - start) / 1000);
            res.forEach( rr -> map.get(rr.base).add(rr));
        }
        html.println("<h2>COMPARISONS</h2>");
        map.forEach((base, l) ->
                {
                    html.println("<p>" + base + "<br/><table><tr>");
                    html.println("<td>python<br/><img src=\"" + l.get(0).base + "_" + WIDTH + "x" + HEIGHT + "_t.jpg\"/></td>");
                    l.forEach(rr -> {
                        html.println("<td>" + rr.type + "<br/><img src=\"" + rr.thumb + "\"/></td>");
                    });
                    html.println("</tr></table></p>");
                }
        );
        html.write("</body></html>");
        html.close();
    };

    private static List<ResizeResult> resizeReport(ImageResizer resizer, File dir, Writer html, String prefix,
                                                   int width, int height) throws Exception {
        html.write("<h2>" + resizer.getClass().getSimpleName() + "</h2><p>\n");
        html.write("<table><tr>\n");
        List ret = new ArrayList();
        File[] images = getMainJPGS();
        int i = 0;
        for (File f : images) {
            ResizeResult rr = resizer.resize(f, dir, prefix, width, height);
            rr.type = prefix;
            html.write("<td><img src=\"" + rr.thumb + "\"/></td>");
            if (++i % 8 == 0) html.write("</tr><tr>\n");
            ret.add(rr);
        }
        html.write("</tr></table></p>\n");
        return ret;
    }
    private static File[] getMainJPGS() {
        File[] jpgs = THUMB_DIR.listFiles(
                (file) -> {
                    String name = file.getName();
                    return file.isFile() && "jpg".equalsIgnoreCase(getExtension(name)) && name.indexOf("_t.") == -1;

                }
        );
        return jpgs;
    }

    private static void rr() {
        ResizeResult rr = ImageResizer.result("IMG_123.JPG", 60, 80);
        System.out.println(rr);
    }

    static void p(String s) {
        System.out.println("[CompareThumbMethods] " + s);
    }
}
