package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.ws.rs.core.Response;

public abstract class BaseResource {

    public static class JsonError {
        @JsonProperty
        public String message;
        @JsonProperty
        public int code;
        @JsonProperty
        public int statusCode;

        public JsonError(String msg) {
            message = msg;
        }
        public JsonError code(int c) {
            this.code = this.statusCode = c;
            return this;
        }
    }

    protected static JsonError errBody(String msg) {
        return new JsonError(msg);
    }

    protected static Response error(int code, String errMsg) {
        return Response.status(code).entity(errBody(errMsg).code(code)).build();
    }
    protected static Response _400(String errMsg) {
        return error(400, errMsg);
    }
}
