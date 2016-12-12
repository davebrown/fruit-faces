package com.moonspider.ff;

import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.SqlQuery;

public interface ImageDAO {

    @SqlQuery("select name from something where id = :id")
    String findNameByName(@Bind("id") int id);

    /**
     * close with no args is used to close the connection
     */
    void close();
}
