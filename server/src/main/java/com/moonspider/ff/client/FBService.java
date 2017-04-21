package com.moonspider.ff.client;

import com.moonspider.ff.model.UserDTO;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface FBService {

    @GET("https://graph.facebook.com/me?fields=name,email")
    Call<UserDTO> me(@Query("access_token")String accessToken);

    public static void main(String[] args) throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://foo.bar/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        FBService fb = retrofit.create(FBService.class);

        String accessToken;
        accessToken = "xxx";
        if (args.length > 0)
            accessToken = args[0];
        Call<UserDTO> call = fb.me(accessToken);
        System.out.println("call: " + call);
        Response<UserDTO> rsp = call.execute();
        System.out.println("response: " + rsp);
        System.out.println("code: " + rsp.code());
        if (rsp.code() != 200) {
            System.out.println("error message: " + rsp.message());
            System.out.println("error body: " + rsp.errorBody());
        } else {
            System.out.println("you are: " + rsp.body());
        }
    }
}
