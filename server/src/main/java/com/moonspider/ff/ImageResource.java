package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.client.TagService;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.ejb.UserEJB;
import com.moonspider.ff.model.ImageDTO;
import com.moonspider.ff.model.TagsDTO;
import com.moonspider.ff.model.UserDTO;
import com.moonspider.ff.util.ImageData;
import com.moonspider.ff.util.ImageResizer;
import com.moonspider.ff.util.ResizeResult;
import com.moonspider.ff.util.ThumbnailatorResizer;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import retrofit2.Call;

import javax.persistence.EntityManager;
import javax.persistence.Query;
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
import static com.moonspider.ff.Util.ML_SIZE;
import static com.moonspider.ff.Util.deleteFiles;
import static com.moonspider.ff.Util.thumbName;
import static org.apache.commons.io.FilenameUtils.getExtension;
import static org.apache.commons.io.FilenameUtils.getBaseName;

@Path("/api/v1/images")
@Produces(MediaType.APPLICATION_JSON)
public class ImageResource extends BaseResource {

    private static final Logger log = LoggerFactory.getLogger(ImageResource.class);
    private TagService tagService;

    public ImageResource(EntityManager entityManager, FFConfiguration config) {
        super(entityManager, config);
        this.tagService = Util.createTagService(config);
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

    private ImageEJB findEJB(int userId, String base) {
        Query q = entityManager.createQuery("select i from ImageEJB i where i.userId=:userId and i.base=:base");
        q.setParameter("userId", userId);
        q.setParameter("base", base);
        return getSingleResult(q, ImageEJB.class);

    }
    // http://stackoverflow.com/questions/29109887/how-can-i-return-404-http-status-from-dropwizard
    @GET
    @Path("/{userId}/{baseName}")
    @Timed
    @UnitOfWork(transactional = false)
    public Optional<ImageDTO> getImage(@PathParam("userId") int userId, @PathParam("baseName") String base) {
        ImageEJB ejb = findEJB(userId, base);
        if (ejb == null) {
            return Optional.empty();
        }
        return Optional.of(new ImageDTO(ejb));
    }

    @DELETE
    @Path("/{userId}/{baseName}")
    @Timed
    @UnitOfWork(transactional = true)
    public Response deleteImage(@HeaderParam("X-FF-Auth") String authToken, @PathParam("userId") int userId, @PathParam("baseName") String base) {
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag DELETE when disallowed!");
            return error(403, "data mutation operations disabled");
        }
        ImageEJB ejb = findEJB(userId, base);
        if (ejb == null) {
            return error(404, "not found");
        }

        checkAuth(findOrCreateUser(authToken), ejb.getUser());

        ImageDTO dto = new ImageDTO(ejb);
        final File thumbDir = new File(config.getThumbDir(), String.valueOf(ejb.getUser().getId()));
        // FIXME: hack to infer thumb name

        deleteFiles(thumbDir, ejb.getFull(), ejb.getOriginal(),
                thumbName(ejb.getBase(), THUMB_SIZE, ejb.getFull()),
                thumbName(ejb.getBase(), ML_SIZE, ejb.getFull())
        );
        entityManager.remove(ejb);
        return Response.ok(dto).build();
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
    @Path("/{userId}/{baseName}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public void addTag(@HeaderParam("X-FF-Auth") String accessToken,
                       @PathParam("userId") int userId, @PathParam("baseName") String base,
                       @PathParam("tag") String tag) {
        log.info("received tag POST: /" + base + " " + tag);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            throw new WebApplicationException(401);
        }
        UserEJB userEJB = findOrCreateUser(accessToken);
        if (userEJB == null) {
            throw new WebApplicationException(403);
        }
        ImageEJB ejb = findEJB(userId, base);
        if (ejb == null) {
            throw new WebApplicationException(404);
        }
        checkAuth(userEJB, ejb.getUser());
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
    @Path("/{userId}/{baseName}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public Response deleteTag(@HeaderParam("X-FF-Auth") String accessToken,
                              @PathParam("userId") int userId, @PathParam("baseName") String base,
                              @PathParam("tag") String tag) {
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag DELETE when disallowed!");
            return error(403, "data mutation operations disabled");
        }
        UserEJB userEJB = findOrCreateUser(accessToken);
        if (userEJB == null) {
            return error(403, "auth needed");
        }
        ImageEJB ejb = findEJB(userEJB.getId(), base);
        if (ejb == null) {
            return error(404, "not found");
        }
        checkAuth(userEJB, ejb.getUser());
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
                             @HeaderParam("X-FF-Auth") String accessToken,
                             @HeaderParam("Content-Length") long contentLength
                         ) throws IOException {
        // step 1: do some validation
        //UserDTO userDTO = user(accessToken);
        UserEJB userEJB = findOrCreateUser(accessToken);
        String fname = contentDispositionHeader != null ? contentDispositionHeader.getFileName() : System.currentTimeMillis() + ".jpg";
        log.info("received new image POST: len=" + contentLength + "/" + contentDispositionHeader + "/" + fname);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            return _400("no write operations allowed");
        } else if (userEJB == null) {
            return error(401, "You must login to post");
        } else if (contentLength <= 0 || contentLength > config.getMaxImageFileSize()) {
            log.warn("image POST for " + fname + " exceeded or absent content-length " + contentLength);
            return _400("invalid content-length");
        } else if (inputStream == null) {
            return _400("no image file posted");
        }

        // step 2: choose filename. Prefer user's existing filename, but uniqify if needed
        // this is b/c safari mobile will always call contemporaneously snapped photos "image.jpg"
        String basename = getBaseName(fname);
        final String ext = getExtension(fname);
        {
            ImageEJB existingImage = findEJB(userEJB.getId(), basename);
            if (existingImage != null) {
                //return _400("image " + basename + " already uploaded");
                basename = basename + "_" + getBaseNameCount(userEJB, basename);
                fname = basename + '.' + ext;
            }
        }

        // step 3: another modicum of validation
        if (emptyOrNull(ext) || !ImageResizer.VALID_EXTS.contains(ext.toLowerCase())) {
            return _400("only jpg or png images allowed");
        }

        // step 4: receive upload input of original image into tmpdir
        final File TMPDIR = getTmpdir( String.valueOf(userEJB.getId()) );
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
        // FIXME: after writing file to disk, validate that it is in fact an image of the claimed type

        // step 5: make scaled versions, main size and thumb size
        // extract timestamp from EXIF for step 7
        final File thumbDir = new File(config.getThumbDir(), String.valueOf(userEJB.getId()));
        thumbDir.mkdirs();
        ImageResizer resizer = new ThumbnailatorResizer();

        ImageData imageData = Util.getImageMetadata(localFile);
        ResizeResult mainSize = resizer.resize(imageData, TMPDIR, MAIN_SIZE.width, MAIN_SIZE.height);
        ResizeResult thumbSize = resizer.resize(imageData, TMPDIR, THUMB_SIZE.width, THUMB_SIZE.height);
        ResizeResult mlSize = resizer.resize(imageData, TMPDIR, ML_SIZE.width, ML_SIZE.height, false);
        File mainFile = new File(TMPDIR, mainSize.thumb);
        File thumbFile = new File(TMPDIR, thumbSize.thumb);
        File mlFile = new File(TMPDIR, mlSize.thumb);

        // step 6: get the tags from shiny awesome ML image recognition service!
        Collection<TagEJB> tags = inferTags(mlFile);

        // step 7: copy images from temp to permanent dir
        // FIXME: use the "force overwrite" variant of these methods
        Util.copyFileToDirectory(localFile, thumbDir);
        Util.copyFileToDirectory(mainFile, thumbDir);
        Util.copyFileToDirectory(thumbFile, thumbDir);
        Util.copyFileToDirectory(mlFile, thumbDir);
        localFile.delete();
        mainFile.delete();
        thumbFile.delete();
        mlFile.delete();

        // step 8: update DB
        final Date now = new Date();
        ImageEJB record = new ImageEJB(basename);
        record.setTagList(tags);
        record.setOriginal(localFile.getName());
        record.setFull(mainSize.thumb);
        record.setTstamp(imageData.timestamp != null ? imageData.timestamp : now);
        record.setImportTime(now);
        record.setUser(userEJB);
        entityManager.persist(record);
        log.info("successfully uploaded and persisted " + record);
        return Response.ok(new ImageDTO(record)).build();
        //return Response.noContent().build();
    }

    private long getBaseNameCount(UserEJB user, String basename) {
        Query q = entityManager.createNativeQuery("SELECT count(*) + 1 from image where user_id=?1 and base like ?2");
        q.setParameter(1, user.getId());
        q.setParameter(2, '%' + basename + '%');
        return getSingleResult(q, Number.class).longValue();
    }

    private Collection<TagEJB> inferTags(File mlFile) throws IOException {
        Collection<TagEJB> tags = Collections.EMPTY_LIST;
        RequestBody requestBody = RequestBody.create(okhttp3.MediaType.parse("image/jpeg"), mlFile);
        MultipartBody.Part thumbPart = null;

        thumbPart = MultipartBody.Part.createFormData("imagefile", mlFile.getName(), requestBody);
        Call<TagsDTO> call = tagService.getTags(thumbPart);
        try {
            retrofit2.Response<TagsDTO> tagResponse = call.execute();
            if (tagResponse.code() != 200) {
                log.error("tagger service call failed code=" + tagResponse.code() + " msg='" + tagResponse.message()
                        + "' body='" + tagResponse.errorBody().string() + "'");
                // don't fail file upload here
            } else {
                TagsDTO tagsDTO = tagResponse.body();
                log.info("got tags for '" + mlFile.getName() + "': " + Arrays.toString(tagsDTO.getTags()));
                tags = new ArrayList<>();
                for (String tag : tagsDTO.getTags()) {
                    TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
                    if (tagEJB != null)
                        tags.add(tagEJB);
                }
            }
        } catch (IOException ioe) {
            log.error("call to tagger service at " + config.getTagServiceUrl() + " failed:", ioe);
            // don't fail image upload on tagging failure
        }
        return tags;
    }
}
