package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.ws.rs.core.Response;

public abstract class BaseResource {

    public static class JsonError {
        @JsonProperty
        public String error;
        public JsonError(String msg) {
            error = msg;
        }
    }

    protected static JsonError errBody(String msg) {
        return new JsonError(msg);
    }

    protected static Response error(int code, String errMsg) {
        return Response.status(code).entity((errBody(errMsg))).build();
    }
    protected static Response _400(String errMsg) {
        return error(400, errMsg);
    }
}
