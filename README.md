# Setup

-   install packages: `npm install`
-   run server: `npm run api`
    -   optional ENV VARs: 
        -   `SENTRY_DSN` 
        -   `PORT`
-   execute example scenarios
    -   `npm run requests:parallel`
        -   sends multiple authenticated requests in parallel
    -   `npm run requests:simple`
        -   sequentially sends two requests: first an Unauthenticated request, followed by an Authenticated request
