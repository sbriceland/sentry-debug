import { initializedSentry as Sentry } from './sentry';

import * as bodyParser from 'body-parser';
import express, { Application, RequestHandler, Router } from 'express';

const app: Application = express();

const apiRouter = Router();

apiRouter.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));
apiRouter.use(bodyParser.json({ limit: '500kb' }));

const Users: { id: string; email: string; name: string }[] = [
    { id: '1', email: 'foo@example.com', name: 'foo example' },
    { id: '2', email: 'foo2@example.com', name: 'foo example2' },
    { id: '3', email: 'foo3@example.com', name: 'foo example3' },
    { id: '4', email: 'foo4@example.com', name: 'foo example4' },
];

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Example auth middleware
 * - Assign the user to Sentry for each request
 */
const auth: RequestHandler = (req, res, next) => {
    const authUser = Users.find((u) => u.id === req.headers['authorization']);
    if (!authUser) {
        Sentry.setTag('Authenticated', false);
        Sentry.setTag('UserID', null);
        Sentry.setUser(null);
        next(new Error('Authentication Error'));
    } else {
        Sentry.setTag('Authenticated', true);
        Sentry.setTag('UserID', authUser.id);
        Sentry.setUser(authUser);
        res.locals.authUser = authUser;
        next();
    }
};

const userRouter = Router();

userRouter.route('').get((_req, res, next) => {
    const randomNum = Math.floor(Math.random() * 1000);
    sleep(randomNum)
        .then(() => {
            Sentry.captureException(new Error('capturing exception..'), {
                // `extra.expectedUser` should match `event.user`
                // `extra.expectedUser.id` should match `event.tags.UserId`
                extra: { expectedUser: res.locals.authUser },
            });
            res.json(Users);
        })
        .catch(next);
});

apiRouter.use('/users', [auth, userRouter]);

app.use('/api', apiRouter);

app.use([
    (err, req, res, next) => {
        const { method, originalUrl, params, query, body } = req;
        const { statusCode, locals } = res;

        const eventId = Sentry.captureException(err, {
            extra: {
                request: { method, originalUrl, params, query, body },
                response: { statusCode, locals },
            },
        });
        (res as { sentry?: string }).sentry = eventId;

        if (!res.headersSent) res.status(500).json({ errorMessage: 'Oops!' });

        next(err);
    },
]);

// Or just use this, which is identical to above, without `extras`
// Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running @ http://localhost:${PORT}`);
});
