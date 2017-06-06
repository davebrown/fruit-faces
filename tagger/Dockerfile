FROM ubuntu

RUN apt-cache update
RUN apt-get install -y python2.7 python-pip
RUN mkdir /app
# Bundle app source
COPY tagservice.py /app/tagservice.py
COPY model_plates-28x28.h5 /app/model_plates-28x28.h5

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

EXPOSE  5000
CMD ["python", "/src/tagservice.py", "-v run /src/model_plates-28x28.h5"]
