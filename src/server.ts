import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import express, { Application, NextFunction, Request, Response, Router } from 'express';

const DSN = process.env.SENTRY_DSN;

Sentry.init({
    dsn: DSN,
    beforeSend: (event, hint, ...args) => {
        const { type, contexts, exception, extra, tags, message, user, request } = event;
        console.dir(
            {
                whoami: 'sentry:beforeSend',
                event: { type, contexts, exception, extra, tags, message, user, request },
                hint,
                args,
            },
            { depth: null }
        );
        return event;
    },
    release: 'sentry-scope-testing',
    environment: 'local',
    skipOpenTelemetrySetup: true,
});

const app: Application = express();

const router = Router();

router.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));
router.use(bodyParser.json({ limit: '500kb' }));

const Users: { id: string; email: string; name: string }[] = [
    { id: '1', email: 'foo@example.com', name: 'foo example' },
    { id: '2', email: 'foo2@example.com', name: 'foo example2' },
    { id: '3', email: 'foo3@example.com', name: 'foo example3' },
    { id: '4', email: 'foo4@example.com', name: 'foo example4' },
];

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

router.use('/users', function (req, res, next) {
    try {
        const reqUser = Users.find((u) => u.id === req.headers['authorization']);
        if (reqUser) {
            Sentry.setTag('Authenticated', true);
            Sentry.setUser(reqUser);
            const randomNum = Math.floor(Math.random() * 3000);
            sleep(randomNum).then(() => {
                Sentry.withScope((scope) => {
                    // extras will include correct User.
                    // This allows a reference point to check the reported Issue User and the Additional Data reqUser
                    // Our tests confirm that this is often wrong when the api is dealing with requests in parallel
                    scope.setExtras({ reqUser, randomNum });
                    Sentry.captureMessage('sentry-scope-testing!');
                });
                res.json(Users);
            });
        } else {
            throw new Error('Authentication Error');
        }
    } catch (err) {
        next(err);
    }
});

app.use('/api', router);

app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, params, query, body } = req;
    const { statusCode, locals } = res;

    Sentry.withScope((scope) => {
        scope.setExtras({
            request: { method, originalUrl, params, query, body },
            response: { statusCode, locals },
        });
        const eventId = Sentry.captureException(err);
        (res as { sentry?: string }).sentry = eventId;
    });

    if (!res.headersSent) res.status(500).json({ errorMessage: 'Oops!' });

    next(err);
});

// Or just use this, which is identical to above, without `extras`
// Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running @ http://localhost:${PORT}`);
});
