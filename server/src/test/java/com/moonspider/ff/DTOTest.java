package com.moonspider.ff;

import com.moonspider.ff.model.UserDTO;
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static com.moonspider.ff.Util.toJSON;
import static com.moonspider.ff.Util.fromJSON;

public class DTOTest {

    @Test
    public void testUserDTO() throws Exception {
        // JSON as received from FB
        final String FB_JSON = "{\"name\":\"Donald Duck\",\"email\":\"facebook\\u0040domain.com\",\"id\":\"1563589003653094\"}";
        UserDTO user = fromJSON(FB_JSON, UserDTO.class);
        assertEquals("names not equal", "Donald Duck", user.getName());
        assertEquals("emails not equal", "facebook@domain.com", user.getEmail());
        assertEquals("id's not equal", "1563589003653094", user.getFbId());

        System.out.println(toJSON(user));

        user = fromJSON(toJSON(user), UserDTO.class);
        assertEquals("emails not equal", "facebook@domain.com", user.getEmail());
        assertEquals("id's not equal", "1563589003653094", user.getFbId());

        // JSON used in this app
        final String FF_JSON = "{\"name\":\"Dopey Dwarf\",\"email\":\"dopey\\u0040snowwhite.com\",\"id\":\"1563589003653095\"}";
        user = fromJSON(FF_JSON, UserDTO.class);
        assertEquals("names not equal", "Dopey Dwarf", user.getName());
        assertEquals("emails not equal", "dopey@snowwhite.com", user.getEmail());
        assertEquals("id's not equal", "1563589003653095", user.getFbId());

        System.out.println(toJSON(user));
        user = fromJSON(toJSON(user), UserDTO.class);
        assertEquals("emails not equal", "dopey@snowwhite.com", user.getEmail());
        assertEquals("id's not equal", "1563589003653095", user.getFbId());

    }
}
