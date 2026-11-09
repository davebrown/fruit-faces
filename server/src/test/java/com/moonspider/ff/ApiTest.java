package com.moonspider.ff;

import com.fasterxml.jackson.databind.JsonNode;
import com.moonspider.ff.client.FBService;
import com.moonspider.ff.model.UserDTO;
import com.sun.net.httpserver.HttpServer;
import io.dropwizard.testing.ConfigOverride;
import io.dropwizard.testing.DropwizardTestSupport;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import retrofit2.Call;

import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Comparator;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class ApiTest {
    private static final String SCHEMA = "ff_test_" + UUID.randomUUID().toString().replace("-", "");
    private static final String DATABASE_URL = System.getenv().getOrDefault(
            "FF_TEST_DATABASE_URL", "jdbc:postgresql://localhost:5432/postgres");
    private static final String DATABASE_USER = System.getenv().getOrDefault(
            "FF_TEST_DATABASE_USER", System.getProperty("user.name"));
    private static final String DATABASE_PASSWORD = System.getenv().getOrDefault("FF_TEST_DATABASE_PASSWORD", "");
    private static final String TEST_URL = DATABASE_URL + (DATABASE_URL.contains("?") ? "&" : "?")
            + "currentSchema=" + SCHEMA;
    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static DropwizardTestSupport<FFConfiguration> app;
    private static HttpServer tagger;
    private static Path thumbs;
    private static FBService originalFacebook;

    @BeforeClass
    public static void start() throws Exception {
        thumbs = Files.createTempDirectory("ff-api-test-");
        try (Connection connection = DriverManager.getConnection(DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD);
             Statement sql = connection.createStatement()) {
            sql.execute("CREATE SCHEMA " + SCHEMA);
        }
        // Run the real migrations in an isolated schema, never against the local gallery.
        try (Connection connection = connect();
             Liquibase migrations = new Liquibase("migrations.postgresql.sql",
                     new ClassLoaderResourceAccessor(), new JdbcConnection(connection))) {
            migrations.update(new Contexts(), new LabelExpression());
            migrations.update(new Contexts(), new LabelExpression());
        }
        tagger = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        tagger.createContext("/", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] body = "{\"tags\":[\"blue\",\"apple\"]}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (java.io.OutputStream output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        tagger.start();
        originalFacebook = BaseResource.fb;
        BaseResource.fb = mock(FBService.class);
        for (String token : new String[]{"test-owner", "test-other"}) {
            UserDTO profile = new UserDTO();
            profile.setFbId(token);
            profile.setName(token);
            profile.setEmail(token + "@example.test");
            Call<UserDTO> call = mock(Call.class);
            when(call.execute()).thenReturn(retrofit2.Response.success(profile));
            when(BaseResource.fb.me(token)).thenReturn(call);
        }
        app = new DropwizardTestSupport<>(FFApplication.class, "src/test/resources/api.yaml",
                ConfigOverride.config("database.url", TEST_URL),
                ConfigOverride.config("database.user", DATABASE_USER),
                ConfigOverride.config("database.password", DATABASE_PASSWORD),
                ConfigOverride.config("thumbDir", thumbs.toString()),
                ConfigOverride.config("tagServiceUrl", "http://127.0.0.1:" + tagger.getAddress().getPort() + "/"));
        app.before();
    }

    @AfterClass
    public static void stop() throws Exception {
        try {
            if (app != null) app.after();
        } finally {
            if (originalFacebook != null) BaseResource.fb = originalFacebook;
            if (tagger != null) tagger.stop(0);
            try (Connection connection = DriverManager.getConnection(DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD);
                 Statement sql = connection.createStatement()) {
                sql.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
            }
            if (thumbs != null) {
                try (Stream<Path> paths = Files.walk(thumbs)) {
                    for (Path path : paths.sorted(Comparator.reverseOrder()).collect(Collectors.toList())) {
                        Files.delete(path);
                    }
                }
            }
        }
    }

    @Before
    public void reset() throws Exception {
        try (Connection connection = connect(); Statement sql = connection.createStatement()) {
            sql.execute("TRUNCATE image_tag, image, tag, ff_user RESTART IDENTITY CASCADE");
            sql.execute("INSERT INTO ff_user (fb_id, name) VALUES ('test-root', 'Root')");
        }
    }

    @Test
    public void uploadCatalogTagsAndDeletePreserveTheApiContract() throws Exception {
        HttpResponse<String> registration = request("POST", "/api/v1/users/register", "test-owner", null, null);
        assertEquals(200, registration.statusCode());
        int owner = json(registration).path("ffId").asInt();
        assertTrue(owner > 1);
        assertEquals(owner, json(request("POST", "/api/v1/users/register", "test-owner", null, null))
                .path("ffId").asInt());

        HttpResponse<String> uploaded = upload("face.jpg", "test-owner");
        assertEquals(uploaded.body(), 200, uploaded.statusCode());
        JsonNode image = json(uploaded);
        assertTrue(image.path("id").asInt() > 0);
        assertEquals("face", image.path("base").asText());
        assertEquals("/" + owner, image.path("root").asText());
        assertEquals(owner, image.path("user").path("ffId").asInt());
        assertFalse(image.path("user").has("email"));
        assertTrue(image.path("timestamp").asLong() > 0);
        Path main = thumbs.resolve(owner + "/" + image.path("full").asText());
        assertTrue(Files.exists(main));
        assertEquals(1, json(request("GET", "/api/v1/images", null, null, null)).size());
        assertEquals(image, json(request("GET", "/api/v1/images/" + owner + "/face", null, null, null)));
        assertEquals(1, json(request("GET", "/api/v1/images/mine", "test-owner", null, null)).size());
        assertEquals(1, json(request("GET", "/api/v1/images/tags/blue", null, null, null)).size());
        assertEquals(0, json(request("GET", "/api/v1/images/no-plate", null, null, null)).size());
        assertEquals("blue", json(request("GET", "/api/v1/tags/colors", null, null, null)).get(0).asText());
        assertEquals("apple", json(request("GET", "/api/v1/tags/non-colors", null, null, null)).get(0).asText());

        HttpResponse<String> duplicate = upload("face.jpg", "test-owner");
        assertEquals(303, duplicate.statusCode());
        assertTrue(duplicate.headers().firstValue("location").orElse("").endsWith(
                "/api/v1/images/" + owner + "/face"));
        assertEquals(1, json(request("GET", "/api/v1/images", null, null, null)).size());

        String path = "/api/v1/images/" + owner + "/face";
        assertEquals(204, request("POST", path + "/tags/banana", "test-owner", null, null).statusCode());
        assertEquals(204, request("POST", path + "/tags/banana", "test-owner", null, null).statusCode());
        assertEquals(1, json(request("GET", "/api/v1/images/tags/banana", null, null, null)).size());
        assertEquals(403, request("DELETE", path, "test-other", null, null).statusCode());
        assertEquals(1, json(request("GET", "/api/v1/images", null, null, null)).size());
        assertEquals(204, request("DELETE", path + "/tags/blue", "test-owner", null, null).statusCode());
        assertEquals(1, json(request("GET", "/api/v1/images/no-plate", null, null, null)).size());

        HttpResponse<String> preview = request("GET", "/api/v1/preview/" + owner + "/face", null, null, null);
        assertEquals(200, preview.statusCode());
        assertTrue(preview.body().contains("og:image"));
        assertTrue(preview.body().contains(image.path("full").asText()));
        for (String route : new String[]{"by-month", "day-of-week", "time-of-day"}) {
            HttpResponse<String> stats = request("GET", "/api/v1/stats/" + route, null, null, null);
            assertEquals(stats.body(), 200, stats.statusCode());
            assertTrue(json(stats).isArray());
            assertTrue(json(stats).size() > 0);
        }

        assertEquals(200, request("DELETE", path, "test-owner", null, null).statusCode());
        assertFalse(Files.exists(main));
        assertEquals(0, json(request("GET", "/api/v1/images", null, null, null)).size());
        assertEquals(404, request("GET", path, null, null, null).statusCode());
    }

    @Test
    public void authenticationAndUploadValidationRejectInvalidRequests() throws Exception {
        assertEquals(401, request("POST", "/api/v1/users/register", null, null, null).statusCode());
        assertEquals(401, request("GET", "/api/v1/images/mine", null, null, null).statusCode());
        assertEquals(403, request("GET", "/api/v1/users", null, null, null).statusCode());
        HttpResponse<String> unauthenticated = upload("face.jpg", null);
        assertEquals(401, unauthenticated.statusCode());
        assertEquals(401, json(unauthenticated).path("statusCode").asInt());
        HttpResponse<String> invalid = upload("face.txt", "test-owner");
        assertEquals(400, invalid.statusCode());
        assertTrue(json(invalid).path("message").asText().contains("jpg or png"));
        assertEquals(0, json(request("GET", "/api/v1/images", null, null, null)).size());
    }

    @Test
    public void readOnlyModeBlocksWritesAndCorsAllowsFrontendAuthentication() throws Exception {
        app.getConfiguration().setAllowWriteOperations(false);
        try {
            assertEquals(400, upload("face.jpg", null).statusCode());
            assertEquals(403, request("DELETE", "/api/v1/images/1/face", null, null, null).statusCode());
            assertEquals(401, request("POST", "/api/v1/images/1/face/tags/blue", null, null, null).statusCode());
        } finally {
            app.getConfiguration().setAllowWriteOperations(true);
        }
        HttpResponse<String> cors = CLIENT.send(HttpRequest.newBuilder(uri("/api/v1/images"))
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "X-FF-Auth,Content-Type")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, cors.statusCode());
        assertTrue(cors.headers().firstValue("access-control-allow-headers").orElse("").contains("X-FF-Auth"));
    }

    private static Connection connect() throws Exception {
        return DriverManager.getConnection(TEST_URL, DATABASE_USER, DATABASE_PASSWORD);
    }

    private static URI uri(String path) {
        return URI.create("http://127.0.0.1:" + app.getLocalPort() + path);
    }

    private static JsonNode json(HttpResponse<String> response) throws Exception {
        return Util.JSON.readTree(response.body());
    }

    private static HttpResponse<String> request(String method, String path, String token,
                                               byte[] body, String contentType) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path));
        if (token != null) request.header("X-FF-Auth", token);
        if (contentType != null) request.header("Content-Type", contentType);
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(body));
        return CLIENT.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static HttpResponse<String> upload(String filename, String token) throws Exception {
        String boundary = "ff-test-boundary";
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"avoidDups\"\r\n\r\ntrue\r\n"
                + "--" + boundary + "\r\nContent-Disposition: form-data; name=\"imagefile\"; filename=\""
                + filename + "\"\r\nContent-Type: image/jpeg\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        try (java.io.InputStream image = ApiTest.class.getResourceAsStream("/images/landscape-0.jpg")) {
            image.transferTo(body);
        }
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return request("POST", "/api/v1/images", token, body.toByteArray(), "multipart/form-data; boundary=" + boundary);
    }
}
