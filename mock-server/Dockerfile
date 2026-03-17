FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache tini \
	&& npm install -g json-server@0.17.4 \
	&& addgroup -S app \
	&& adduser -S app -G app

COPY --chown=app:app db.json .

USER app

EXPOSE 3000

ENTRYPOINT ["tini", "--"]

CMD ["json-server", "--watch", "db.json", "--host", "0.0.0.0", "--port", "3000"]