package com.moonspider.ff.util;

public class ResizeResult {

    public String base, full, thumb;

    // debug/dev only
    public String type;

    public ResizeResult() {

    }

    public ResizeResult base(String b) {
        this.base = b;
        return this;
    }

    public ResizeResult thumb(String t) {
        this.thumb = t;
        return this;
    }

    public ResizeResult full(String f) {
        full = f;
        return this;
    }

    @Override
    public String toString() {
        return "ResizeResult{" +
                "base='" + base + '\'' +
                ", full='" + full + '\'' +
                ", thumb='" + thumb + '\'' +
                '}';
    }
}
