FROM java:8-jdk
WORKDIR /app
ADD target/ff-1.0.0.jar /app
ADD docker.yaml /app
EXPOSE 9080
CMD ["java", "-jar", "ff-1.0.0.jar", "server", "docker.yaml"]
