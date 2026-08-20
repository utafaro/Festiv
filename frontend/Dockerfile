FROM node:22-alpine AS build
WORKDIR /app

# Guards against https://github.com/npm/cli/issues/4828 (npm 10.x sometimes
# fails to install the correct native optional-dependency binary, e.g. for
# rolldown/tailwind's Rust bindings) — the base image's bundled npm hit this.
RUN npm install -g npm@latest

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Vite bakes VITE_* vars in at build time, not runtime — must be passed as a
# build-arg (Coolify: set it as a "build variable" so it reaches `docker build`).
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
