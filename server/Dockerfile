FROM eclipse-temurin:11-jre
WORKDIR /app
ADD target/ff-1.0.0.jar /app
ADD docker.yaml /app
EXPOSE 9080
# docker run -p 9080:9080
CMD ["java", "-jar", "ff-1.0.0.jar", "server", "docker.yaml"]
