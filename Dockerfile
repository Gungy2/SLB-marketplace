FROM reachsh/reach:latest as reachBuild

COPY app/index.rsh .
RUN [ "/usr/bin/reachc", "/app/index.rsh" ]

FROM node:18
RUN mkdir /application
WORKDIR /application
RUN npm install -g pnpm
COPY . .
RUN pnpm install

COPY --from=reachBuild /app/build app/build

EXPOSE 5173
RUN chmod +x run.sh
ENTRYPOINT [ "/bin/bash",  "-c", "./run.sh" ]
