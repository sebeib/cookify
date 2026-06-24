package me.eibisch.cookify.tag.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import me.eibisch.cookify.tag.service.TagService;

@Path("/api/tag")
@Produces(MediaType.APPLICATION_JSON)
public class TagResource {

    private final TagService tagService;

    @Inject
    public TagResource(TagService tagService) {
        this.tagService = tagService;
    }

    @GET
    public List<TagResponse> getTags(@QueryParam("query") String query) {
        return tagService.findSuggestions(query)
                .stream()
                .map(TagResponse::from)
                .toList();
    }
}
