package com.moonspider.ff;

import com.google.common.collect.MapMaker;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public class MavenSecurityTest {
    @Test
    public void mavenRejectsVulnerableGuavaDeserialization() throws Exception {
        String filter = Files.readString(Path.of(".mvn/jvm.config")).trim();
        Process check = new ProcessBuilder(
                Path.of(System.getProperty("java.home"), "bin", "java").toString(),
                filter, "-cp", System.getProperty("java.class.path"), MavenSecurityTest.class.getName())
                .redirectErrorStream(true).start();
        String output = new String(check.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(output, 0, check.waitFor());
    }

    public static void main(String[] args) throws Exception {
        // Maven still bundles affected Guava; reject its native serialization before readObject runs.
        for (String name : new String[]{"CompactHashMap", "CompactHashSet"}) {
            Method create = Class.forName("com.google.common.collect." + name).getDeclaredMethod("create");
            create.setAccessible(true);
            assertRejected(create.invoke(null));
        }
        assertRejected(new MapMaker().weakKeys().makeMap());
        assertEquals(new HashMap<>(), roundTrip(new HashMap<>()));
    }

    private static void assertRejected(Object value) throws Exception {
        try {
            roundTrip(value);
            fail("Guava deserialization was not blocked: " + value.getClass().getName());
        } catch (InvalidClassException expected) {
            assertTrue(expected.getMessage(), expected.getMessage().contains("filter status: REJECTED"));
        }
    }

    private static Object roundTrip(Object value) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream output = new ObjectOutputStream(bytes)) {
            output.writeObject(value);
        }
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray()))) {
            return input.readObject();
        }
    }
}
