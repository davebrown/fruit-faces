package com.moonspider.ff.client;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.moonspider.ff.Util;
import com.moonspider.ff.model.UserDTO;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Query;

import java.io.IOException;

public interface FBService {

    //@GET("https://graph.facebook.com/me")
    @GET("https://graph.facebook.com/me?fields=name,email")
    Call<UserDTO> me(@Query("access_token")String accessToken);

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
        accessToken = "EAAXZAbuB1ingBANBNsPmC7fszJ8BdgkE90wkfSrYXhb2SEKqOjIhPofxNpARzRyZB5yylIP28w9ZBG60b9HPTBtL0M5ZBE7zy1AryBoLR5M8CTW2bTrJze9U9DCf5VSDWUAgnbf8nR75VqLzAGu1iChWF4ClWZBMTafpAdfZAZBtawqB1b4duFfIeZBw2ya8JRsZD";
        //if (args.length > 0) accessToken = args[0];
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
}
