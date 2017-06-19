package com.moonspider.ff.client;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.moonspider.ff.Util;
import com.moonspider.ff.model.PermissionsDTO;
import com.moonspider.ff.model.UserDTO;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Query;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public interface FBService {

    //@GET("https://graph.facebook.com/me")
    @GET("https://graph.facebook.com/me?fields=name,email,picture,permissions")
    Call<UserDTO> me(@Query("access_token")String accessToken);

    @GET("https://graph.facebook.com/me/permissions")
    Call<PermissionsDTO> permissions(@Query("access_token") String accessToken);


    public static class PermissionsDeserializer extends StdDeserializer {
        public PermissionsDeserializer() {
            super(PermissionsDTO.class);
        }

        public Object deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
            Map<String,Boolean> map = new HashMap<>();
            JsonNode root = jsonParser.getCodec().readTree(jsonParser);
            PermissionsDTO ret = new PermissionsDTO();
            JsonNode data = root.get("data");
            if (data != null) {
                for (int i = 0; i < data.size(); i++) {
                    JsonNode n = data.get(i);
                    JsonNode p = n.get("permission");
                    JsonNode v = n.get("status");
                    if (p != null && v != null) {
                        map.put(p.asText(), "granted".equalsIgnoreCase(v.asText()) ? true : false);
                    }
                }
            }
            ret.setData(map);
            return ret;
        }
    }

    public static class FBUserDeserializer extends StdDeserializer {

        public FBUserDeserializer() {
            super(UserDTO.class);
        }

        // {"name":"Joe Blow","email":"joe\u0040blow.com","id":"1363589003653845"}
        @Override
        public Object deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
            UserDTO ret = new UserDTO();
            JsonNode root = jsonParser.getCodec().readTree(jsonParser);
            JsonNode n = root.get("name");
            if (n != null) ret.setName(n.asText());
            n = root.get("email");
            if (n != null) ret.setEmail(n.asText());
            n = root.get("id");
            if (n != null) ret.setFbId(n.asText());
            else {
                n = root.get("fbId");
                if (n != null) ret.setFbId(n.asText());
            }
            n = root.get("picture");
            if (n != null) {
                n = n.get("data");
                if (n != null) {
                    n = n.get("url");
                    if (n != null) {
                        ret.setProfileUrl(n.asText());
                    }
                }
            }
            n = root.get("permissions");
            if (n != null) {
                // this feels hacky
                ret.setPermissions( Util.fromJSON(n.toString(), PermissionsDTO.class) );
            }
            return ret;
        }
    }
    public static void main(String[] args) throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://foo.bar/")
                .addConverterFactory(JacksonConverterFactory.create(Util.JSON))
                .build();

        FBService fb = retrofit.create(FBService.class);

        String accessToken;
        accessToken = "EAAXZAbuB1ingBABD4S6UpIDnEkUsABQINC4crZAzhZAREXi25ZACu8YEySfkIyZAXZABArIdaOJunCKtjkw2bb7cWrIgEmLC6O28uZCAgL82tdfKrPcZA1OVqqkjXU2K8HvMhd49XjLW06h8kE7F0a3o2r1z6m3OaITz6GuNzhn3mmtIvnapCVOHvZCBJihRr6obVQB96tAkXN5lMutmOOdm6";
        {
            Call<UserDTO> call = fb.me(accessToken);
            System.out.println("call: " + call);
            Response<UserDTO> rsp = call.execute();
            System.out.println("response: " + rsp);
            System.out.println("code: " + rsp.code());
            if (rsp.code() != 200) {
                System.out.println("error message: " + rsp.message());
                System.out.println("error body: " + rsp.errorBody().string());
            } else {
                System.out.println("you are: " + rsp.body());
            }
        }
        {
            Call<PermissionsDTO> call = fb.permissions(accessToken);
            Response<PermissionsDTO> rsp = call.execute();
            if (rsp.code() != 200) {
                System.out.println("error message: " + rsp.message());
                System.out.println("error body: " + rsp.errorBody().string());
            } else {
                System.out.println("permissions: " + rsp.body());
            }
        }
    }
}
