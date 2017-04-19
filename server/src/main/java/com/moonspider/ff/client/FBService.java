package com.moonspider.ff.client;

import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface FBService {

    @GET("https://graph.facebook.com/me")
    Call<Me> me(@Query("access_token")String accessToken);

    public static class Me {
        private String name, id;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        @Override
        public String toString() {
            return "Me{" +
                    "name='" + name + '\'' +
                    ", id='" + id + '\'' +
                    '}';
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Me me = (Me) o;

            if (name != null ? !name.equals(me.name) : me.name != null) return false;
            return id != null ? id.equals(me.id) : me.id == null;
        }

        @Override
        public int hashCode() {
            int result = name != null ? name.hashCode() : 0;
            result = 31 * result + (id != null ? id.hashCode() : 0);
            return result;
        }
    }

    public static void main(String[] args) throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://graph.facebook.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        FBService fb = retrofit.create(FBService.class);

        String accessToken = "EAAXZAbuB1ingBABIkemAoYyGZC7eWSaZAhQZCwMfzKKz9ZA4xbrnJcBFTSYMc4cQHsBDKnssPgtomUgZCBWTjZBLtwFb88sBnaMAxYRx2ANjoJxRKR12lZCRLKQZCNpTTczHm3rt3rHCrdidoSeONkaiKVSVl06yZAZB4LqtDENkZAKQjcDcJAAgZB844iEJU6d9d9UcZD";
        Call<Me> call = fb.me(accessToken);
        System.out.println("call: " + call);
        Response<Me> rsp = call.execute();
        System.out.println("response: " + rsp);
        System.out.println("code: " + rsp.code());
        System.out.println("you are: " + rsp.body());
    }
}
