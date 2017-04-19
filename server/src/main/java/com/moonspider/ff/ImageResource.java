package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.model.ImageDTO;
import com.moonspider.ff.util.ImageResizer;
import com.moonspider.ff.util.ResizeResult;
import com.moonspider.ff.util.ThumbnailatorResizer;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.apache.commons.io.FileUtils;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.*;
import java.util.*;
import java.util.List;

import static com.moonspider.ff.Util.close;
import static com.moonspider.ff.Util.getTmpdir;
import static com.moonspider.ff.Util.emptyOrNull;
import static com.moonspider.ff.Util.MAIN_SIZE;
import static com.moonspider.ff.Util.THUMB_SIZE;
import static com.moonspider.ff.Util.deleteFiles;
import static org.apache.commons.io.FilenameUtils.getExtension;
import static org.apache.commons.io.FilenameUtils.getBaseName;

@Path("/api/v1/images")
@Produces(MediaType.APPLICATION_JSON)
public class ImageResource extends BaseResource {

    private static final Logger log = LoggerFactory.getLogger(ImageResource.class);

    private final EntityManager entityManager;
    private final FFConfiguration config;
    public ImageResource(EntityManager entityManager, FFConfiguration config) {
        this.entityManager = entityManager;
        this.config = config;
    }

    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<ImageDTO> getAll() {
        //TypedQuery<ImageEJB> query = entityManager.createQuery("SELECT i FROM ImageEJB i ORDER BY random()", ImageEJB.class);
        TypedQuery<ImageEJB> query = entityManager.createQuery("SELECT i FROM ImageEJB i ORDER BY i.tstamp DESC", ImageEJB.class);
        List<ImageEJB> dbList = query.getResultList();
        List<ImageDTO> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(new ImageDTO(ejb)));
        return dtoList;
    }

    @GET
    @Path("/no-plate")
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<ImageDTO> getNoPlateTag() {
        String qs;
        /*
        qs = "SELECT i.tagList from ImageEJB i where i.base = 'IMG_4580'";
        qs = "SELECT i FROM ImageEJB i where i.base = 'IMG_4580'";
        qs = "SELECT i FROM ImageEJB i where 'blue' IN (SELECT t.name from TagEJB t)";
        qs = "SELECT i FROM ImageEJB i where 'blue' = ANY (SELECT t.name from i.tagList t)";
        */
        // FIXME: more efficient way to do this query?
        qs = "SELECT i FROM ImageEJB i where 'blue' NOT MEMBER OF i.tagList and 'white' NOT MEMBER OF i.tagList and 'gray' NOT MEMBER OF i.tagList";
        TypedQuery<ImageEJB> query = entityManager.createQuery(qs, ImageEJB.class);
        List<ImageEJB> dbList = query.getResultList();
        List<ImageDTO> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(new ImageDTO(ejb)));
        return dtoList;
    }

    // http://stackoverflow.com/questions/29109887/how-can-i-return-404-http-status-from-dropwizard
    @GET
    @Path("/{id}")
    @Timed
    @UnitOfWork(transactional = false)
    public Optional<ImageDTO> getImage(@PathParam("id") String base) {
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            return Optional.empty();
        }
        return Optional.of(new ImageDTO(ejb));
    }

    @DELETE
    @Path("/{id}")
    @Timed
    @UnitOfWork(transactional = true)
    public Response deleteImage(@PathParam("id") String base) {
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag DELETE when disallowed!");
            return error(403, "data mutation operations disabled");
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            return error(404, "not found");
        }

        ImageDTO dto = new ImageDTO(ejb);
        final File thumbDir = config.getThumbDir();
        // FIXME: hack to infer thumb name
        String thumbName = ejb.getBase() + "_" + THUMB_SIZE.width + "x" + THUMB_SIZE.height + "_t." + getExtension(ejb.getFull()).toLowerCase();
        deleteFiles(thumbDir, ejb.getFull(), ejb.getOriginal(), thumbName);
        entityManager.remove(ejb);
        return Response.ok(dto).build();
    }

    /* FIXME: this bulk update endpoint has concurrency problems.
       Remove in favor or per-tag PUT/DELETE.
      */
    @PUT
    @Path("/{id}/tags")
    @UnitOfWork(transactional = true)
    public void updateTags(@PathParam("id") String base, Collection<String> tags) {
        log.info("received tag update: /" + base + " " + tags);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            throw new WebApplicationException(401);
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            log.warn("image not found: " + base);
            throw new WebApplicationException(404);
        }
        List<TagEJB> tagEJBs = new ArrayList<>();
        for (String tag : tags) {
            TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
            if (tagEJB == null) {
                log.warn("tag not found: " + tag);
                throw new WebApplicationException(404);
            }
            tagEJBs.add(tagEJB);
        }
        ejb.setTagList(tagEJBs);
        entityManager.persist(ejb);
    }

    /** get images with specified tag */
    @GET
    @Path("/tags/{tag}")
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<ImageDTO> getByTag(String base, @PathParam("tag") String tag) {
        TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
        if (tagEJB == null) {
            return Collections.EMPTY_LIST;
        }
        String qs;
        qs = "SELECT i FROM ImageEJB i WHERE :tag MEMBER OF i.tagList ORDER BY i.tstamp DESC";
        TypedQuery<ImageEJB> query = entityManager.createQuery(qs, ImageEJB.class);
        query.setParameter("tag", tagEJB);
        List<ImageEJB> dbList = query.getResultList();
        List<ImageDTO> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(new ImageDTO(ejb)));
        return dtoList;
    }

    /** associate tag with this image */
    @POST
    @Path("/{id}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public void addTag(@PathParam("id") String base, @PathParam("tag") String tag) {
        log.info("received tag POST: /" + base + " " + tag);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            throw new WebApplicationException(401);
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            throw new WebApplicationException(404);
        }
        TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
        if (tagEJB == null) {
            /* FIXME: allow create new tags from client? At least need auth */
            tagEJB = new TagEJB(tag);
            entityManager.persist(tagEJB);
        }
        if (!ejb.getTagList().contains(tagEJB)) {
            ejb.getTagList().add(tagEJB);
        }
        entityManager.persist(ejb);
    }

    /** remove tag from this image */
    @DELETE
    @Path("/{id}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public Response deleteTag(@PathParam("id") String base, @PathParam("tag") String tag) {
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag DELETE when disallowed!");
            return error(403, "data mutation operations disabled");
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            return error(404, "not found");
        }
        TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
        if (tagEJB != null) {
            ejb.getTagList().remove(tagEJB);
            entityManager.persist(ejb);
        }
        return Response.noContent().build();
    }

    /** upload an image */
    @POST
    @UnitOfWork(transactional = true)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response addImage(@FormDataParam("imagefile") InputStream inputStream,
                             @FormDataParam("imagefile") FormDataContentDisposition contentDispositionHeader,
                             @FormDataParam("fbToken") String fbToken,
                             @HeaderParam("Content-Length") long contentLength
                         ) throws IOException {
        // step 1: do some validation
        String fname = contentDispositionHeader != null ? contentDispositionHeader.getFileName() : System.currentTimeMillis() + ".jpg";
        log.info("received new image POST: len=" + contentLength + "/" + contentDispositionHeader + "/" + fname);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            return _400("no write operations allowed");
        } else if (fbToken == null || "null".equals(fbToken)) {
            return error(401, "You must login to post");
        } else if (contentLength <= 0 || contentLength > config.getMaxImageFileSize()) {
            log.warn("image POST for " + fname + " exceeded or absent content-length " + contentLength);
            return _400("invalid content-length");
        } else if (inputStream == null) {
            return _400("no image file posted");
        }

        // step 2: receive upload input of original image into tmpdir
        final File TMPDIR = getTmpdir();

        // FIXME: filenames might collide with different concurrent users
        // need to parameterize temp upload dir based on some user id when we have auth wired up
        File localFile = new File(TMPDIR, fname);
        OutputStream out = new FileOutputStream(localFile);
        long nread = 0;
        try {
            byte[] buf = new byte[4096];
            int r;
            while ((r = inputStream.read(buf)) > 0) {
                nread += r;
                if (nread > contentLength) {
                    log.warn("image POST for " + fname + " exceeded content-length " + contentLength);
                    close(out);
                    localFile.delete();
                    out = null;
                    return _400("did not meet stated content-length");
                }
                out.write(buf, 0, r);
            }
        } finally {
            close(out);
        }
        // FIXME: validate that it is in fact an image
        final String ext = getExtension(fname);
        if (emptyOrNull(ext) || !ImageResizer.VALID_EXTS.contains(ext.toLowerCase())) {
            localFile.delete();
            return _400("only jpg or png images allowed");
        }
        // step 4: see if we already have this image in DB; reject if so
        final String basename = getBaseName(fname);
        {
            ImageEJB existingImage = entityManager.find(ImageEJB.class, basename);
            if (existingImage != null) {
                return _400("image " + basename + " already uploaded");
            }
        }
        // step 5: make scaled versions, main size and thumb size
        final File thumbDir = config.getThumbDir();
        thumbDir.mkdirs();
        ImageResizer resizer = new ThumbnailatorResizer();
        ResizeResult mainSize = resizer.resize(localFile, TMPDIR, MAIN_SIZE.width, MAIN_SIZE.height);
        ResizeResult thumbSize = resizer.resize(localFile, TMPDIR, THUMB_SIZE.width, THUMB_SIZE.height);
        File mainFile = new File(TMPDIR, mainSize.thumb);
        File thumbFile = new File(TMPDIR, thumbSize.thumb);
        // extract timestamp from EXIF for step 7
        Date timestamp = Util.getEXIFTimestamp(localFile);
        // step 6: copy images from temp to permanent dir
        Util.copyFileToDirectory(localFile, thumbDir);
        Util.copyFileToDirectory(mainFile, thumbDir);
        Util.copyFileToDirectory(thumbFile, thumbDir);
        localFile.delete();
        mainFile.delete();
        thumbFile.delete();
        // step 7: update DB
        ImageEJB record = new ImageEJB(basename);
        record.setOriginal(localFile.getName());
        record.setFull(mainSize.thumb);
        record.setTstamp(timestamp);
        record.setImportTime(new Date());
        entityManager.persist(record);
        // FIXME: return JSON of newly uploaded image
        log.info("successfully uploaded and persisted " + record);
        return Response.ok(new ImageDTO(record)).build();
        //return Response.noContent().build();
    }
}
