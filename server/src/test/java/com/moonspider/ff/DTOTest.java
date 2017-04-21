package com.moonspider.ff;

import com.moonspider.ff.model.UserDTO;
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static com.moonspider.ff.Util.toJSON;
import static com.moonspider.ff.Util.fromJSON;
public class DTOTest {

    @Test
    public void testInOut() throws Exception {
        final String USER_JSON = "{\"name\":\"Donald Duck\",\"email\":\"facebook\\u0040domain.com\",\"id\":\"1563589003653094\"}";
        UserDTO user = fromJSON(USER_JSON, UserDTO.class);
        assertEquals("names not equal", "Donald Duck", user.getName());
        assertEquals("emails not equal", "facebook@domain.com", user.getEmail());
        assertEquals("id's not equal", "1563589003653094", user.getId());

        System.out.println(toJSON(user));
    }
}
