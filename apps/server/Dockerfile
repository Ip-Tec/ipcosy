# Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Build stage
FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ipcosy/db build
RUN pnpm --filter @ipcosy/ip-socket build
RUN pnpm --filter @ipcosy/server build

# Production stage
FROM base AS prod
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app

EXPOSE 8080
CMD [ "pnpm", "--filter", "@ipcosy/server", "start" ]
