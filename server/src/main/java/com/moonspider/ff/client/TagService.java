package com.moonspider.ff.client;

import com.moonspider.ff.model.PingDTO;
import com.moonspider.ff.model.TagsDTO;
import com.moonspider.ff.model.UserDTO;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;

import java.io.File;

public interface TagService {

    @Multipart
    @POST("tags")
    Call<TagsDTO> getTags(@Part MultipartBody.Part thumbFile);

    @GET("ping")
    Call<PingDTO> ping();

    public static void main(String[] args) throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://127.0.0.1:5000/api/v1/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        TagService ts = retrofit.create(TagService.class);

        Call<PingDTO> pingCall = ts.ping();
        Response<PingDTO> pingRsp = pingCall.execute();
        if (pingRsp.code() == 200) {
            PingDTO ping = pingRsp.body();
            System.out.println("PING OK(?) " + ping.getStatus() + " // " + ping);
        } else {
            System.err.println("non-200 from tagger service: " + pingRsp.code());
        }
        File f = new File("../thumbs-orig/IMG_3110_28x28_t.jpg");
        RequestBody requestBody = RequestBody.create(MediaType.parse("image/jpeg"), f);
        MultipartBody.Part thumbPart = null;

        thumbPart = MultipartBody.Part.createFormData("imagefile", f.getName(), requestBody);
        Call<TagsDTO> call = ts.getTags(thumbPart);
        System.out.println("call: " + call);
        Response<TagsDTO> rsp = call.execute();
        System.out.println("response: " + rsp);
        System.out.println("code: " + rsp.code());
        if (rsp.code() != 200) {
            System.out.println("error message: " + rsp.message());
            System.out.println("error body: " + rsp.errorBody());
        } else {
            System.out.println("the tags are: " + rsp.body());
        }
    }

    static void p(String s) {
        System.out.println("[TagService] " + s);
    }
}
