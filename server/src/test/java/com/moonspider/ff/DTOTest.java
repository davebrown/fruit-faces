package com.moonspider.ff;

import com.moonspider.ff.model.PermissionsDTO;
import com.moonspider.ff.model.UserDTO;
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static com.moonspider.ff.Util.toJSON;
import static com.moonspider.ff.Util.fromJSON;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

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
    @Test
    public void testUserWithPerms() throws Exception {
        final String JSON = "{\"name\":\"Ffone Brown\",\"email\":\"facebook+ff1@moonspider.com\",\"picture\":{\"data\":{\"is_silhouette\":false,\"url\":\"https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/16427556_111713792679943_5567682702822243683_n.jpg?oh=6dbe48a3e416743830ad1297bf0a0e33&oe=59CFE44E\"}},\"permissions\":{\"data\":[{\"permission\":\"email\",\"status\":\"granted\"},{\"permission\":\"public_profile\",\"status\":\"granted\"},{\"permission\":\"publish_actions\",\"status\":\"declined\"}]},\"id\":\"174303993087589\"}";
        UserDTO dto  = fromJSON(JSON, UserDTO.class);
        System.out.println("user dto with perms: " + dto);
        PermissionsDTO perms = dto.getPermissions();
        assertTrue("expected email permission", perms.hasPermission("email"));
        assertTrue("expect public_profile permission", perms.hasPermission("public_profile"));
        assertFalse("expect no publish_actions permission", perms.hasPermission("publish_actions"));
        System.out.println("JSON roundtrip: " + Util.toJSON(dto));
    }

    @Test
    public void testPermissionsDTO() throws Exception {
        String PERM_JSON = "{\"data\":[{\"permission\":\"email\",\"status\":\"granted\"},{\"permission\":\"publish_actions\",\"status\":\"declined\"},{\"permission\":\"public_profile\",\"status\":\"granted\"}]}";
        PermissionsDTO dto = fromJSON(PERM_JSON, PermissionsDTO.class);
        System.out.println("permissions: " + dto);
        assertFalse(dto.hasPermission("publish_actions"));
        assertTrue(dto.hasPermission("public_profile"));
        assertTrue(dto.hasPermission("email"));
        assertFalse(dto.hasPermission("not_exists"));
        System.out.println("perms json=" + toJSON(dto));
    }
}
