FROM denoland/deno:bin-2.0.0 AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:20
COPY --from=deno /deno /usr/local/bin/deno

RUN apt-get update && apt-get install -y protobuf-compiler
