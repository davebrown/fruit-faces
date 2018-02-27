FROM gw000/keras:2.1.4-py2-tf-cpu

WORKDIR /srv

ADD . /srv
RUN pip install --trusted-host pypi.python.org -r requirements.txt
EXPOSE 5000
CMD ["./dev.sh"]
