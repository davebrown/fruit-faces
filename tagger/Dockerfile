FROM alpine:3.5

ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
ENV LOCAL_RESOURCES 2048,.8,1.0

ENV BAZEL_VERSION 0.4.5
ENV TENSORFLOW_VERSION 1.1.0

# Update
RUN apk add --update python py-pip ca-certificates
RUN apk add --update --virtual build-deps python-dev gcc build-base zlib-dev jpeg-dev libpng-dev curl cmake zip bash openjdk8 linux-headers lapack-dev openblas

# hack https://github.com/docker-library/python/issues/112
RUN ln -s /usr/include/locale.h /usr/include/xlocale.h

RUN cd /tmp \
&& pip install numpy \
&& pip install wheel \
&& curl -SLO https://github.com/bazelbuild/bazel/releases/download/${BAZEL_VERSION}/bazel-${BAZEL_VERSION}-dist.zip \
    && mkdir bazel-${BAZEL_VERSION} \
    && unzip -qd bazel-${BAZEL_VERSION} bazel-${BAZEL_VERSION}-dist.zip \
    && cd bazel-${BAZEL_VERSION} \
    && : add -fpermissive compiler option to avoid compilation failure \
    && sed -i -e '/"-std=c++0x"/{h;s//"-fpermissive"/;x;G}' tools/cpp/cc_configure.bzl \
    && : add '#include <sys/stat.h>' to avoid mode_t type error \
    && sed -i -e '/#endif  \/\/ COMPILER_MSVC/{h;s//#else/;G;s//#include <sys\/stat.h>/;G;}' third_party/ijar/common.h \
    && bash compile.sh \
    && cp -p output/bazel /usr/bin/ \
    && : \
    && : build TensorFlow pip package \
    && cd /tmp \
    && curl -SL https://github.com/tensorflow/tensorflow/archive/v${TENSORFLOW_VERSION}.tar.gz \
        | tar xzf - \
    && cd tensorflow-${TENSORFLOW_VERSION} \
    && : add python symlink to avoid python detection error in configure \
    && $(cd /usr/bin && ln -s python3 python) \
    && : musl-libc does not have "secure_getenv" function \
    && sed -i -e '/JEMALLOC_HAVE_SECURE_GETENV/d' third_party/jemalloc.BUILD \
sed -i -e 's/2b7430d96aeff2bb624c8d52182ff5e4b9f7f18a/af2d5f5ad3808b38ea58c9880be1b81fd2a89278/' \
        -e 's/e5d3d4e227a0f7afb8745df049bbd4d55474b158ca5aaa2a0e31099af24be1d0/89fb700e6348a07829fac5f10133e44de80f491d1f23bcc65cba072c3b374525/' \
            tensorflow/workspace.bzl \
    && echo | PYTHON_BIN_PATH=/usr/bin/python \
                CC_OPT_FLAGS="-march=native" \
                TF_NEED_JEMALLOC=1 \
                TF_NEED_GCP=0 \
                TF_NEED_HDFS=0 \
                TF_NEED_OPENCL=0 \
                TF_NEED_CUDA=0 \
                TF_ENABLE_XLA=0 \
                bash configure \
    && bazel build -c opt --local_resources ${LOCAL_RESOURCES} //tensorflow/tools/pip_package:build_pip_package \
    && ./bazel-bin/tensorflow/tools/pip_package/build_pip_package /tmp/tensorflow_pkg \
    && : \
    && : install python modules including TensorFlow \
    && cd \
    && pip3 install --no-cache-dir /tmp/tensorflow_pkg/tensorflow-${TENSORFLOW_VERSION}-cp35-cp35m-linux_x86_64.whl
# Bundle app source
COPY restserver.py /src/restserver.py
COPY model_mnist-28x28.h5 /src/model_mnist-28x28.h5

COPY requirements.txt /src/requirements.txt
RUN pip install -r /src/requirements.txt

# remove build deps so image not so bloated
RUN apk del build-deps

EXPOSE  5000
CMD ["python", "/src/restserver.py", "-v run /src/model_mnist-28x28.h5"]
