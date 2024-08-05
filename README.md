# Setup

**Install dependencies**

```sh
npm install
```

**Run server**

-   optional ENV VARs:
    -   `SENTRY_DSN`
    -   `PORT`

```sh
npm run api
```

**Execute example scenarios**

-   optional ENV VARs:
    -   `PORT`

Send multiple authenticated requests in parallel:

```sh
npm run requests:parallel
```

Sequentially sends two requests: first an Unauthenticated request, followed by an Authenticated request:

```sh
npm run requests:simple
```
