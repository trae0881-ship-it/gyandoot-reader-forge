# API gateway: one public URL for auth, rest, storage and functions.
FROM kong:3.6
USER root
RUN apt-get update && apt-get install -y --no-install-recommends gettext-base && rm -rf /var/lib/apt/lists/*
COPY deploy/backend/gateway/kong.yml.template /kong.yml.template
COPY deploy/backend/gateway/start.sh /start.sh
RUN chmod +x /start.sh
USER kong
ENV KONG_DATABASE=off \
    KONG_DECLARATIVE_CONFIG=/tmp/kong.yml \
    KONG_PLUGINS=bundled \
    KONG_NGINX_PROXY_PROXY_BUFFER_SIZE=160k \
    KONG_NGINX_PROXY_PROXY_BUFFERS="64 160k"
CMD ["/start.sh"]
