package com.moonspider.ff;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Closeable;
import java.io.IOException;

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
}
