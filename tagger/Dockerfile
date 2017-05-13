FROM ubuntu

RUN apt-cache update
RUN apt-get install -y python2.7 python-pip
RUN mkdir /app
# Bundle app source
COPY restserver.py /app/restserver.py
COPY model_mnist-28x28.h5 /app/model_mnist-28x28.h5

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

EXPOSE  5000
CMD ["python", "/src/restserver.py", "-v run /src/model_mnist-28x28.h5"]
