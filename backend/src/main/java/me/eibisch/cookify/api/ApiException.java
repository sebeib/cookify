package me.eibisch.cookify.api;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

public class ApiException extends WebApplicationException {

    public ApiException(Response.Status status, String message) {
        super(Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new ApiError(message))
                .build());
    }
}
