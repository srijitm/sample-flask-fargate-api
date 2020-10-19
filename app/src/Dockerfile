FROM python:3.7.9-slim

LABEL maintainer="srijit@amazon.com"

COPY ./requirements.txt /app/requirements.txt

WORKDIR /app

RUN pip install --no-cache-dir  -r requirements.txt

COPY . /app

ENTRYPOINT [ "python" ]

CMD [ "app.py" ]