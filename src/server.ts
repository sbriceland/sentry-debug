import { setTag, setUser, captureException } from './sentry';

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

/** use this to set unique tags to confirm they don't bleed into subsequent request scopes */
let requestId = 1;

/**
 * Example auth middleware
 * - Assign the user to Sentry for each request
 */
const auth: RequestHandler = (req, res, next) => {
    requestId = requestId + 1;
    res.locals.requestId = requestId;
    const authUser = Users.find((u) => u.id === req.headers['authorization']);
    if (!authUser) {
        setTag(`Authenticated-${requestId}`, false);
        setTag(`UserID-${requestId}`, null);
        setUser(null);
        const randomNum = Math.floor(Math.random() * 1000);
        sleep(randomNum)
            .then(() => {
                next(new Error('Authentication Error'));
            })
            .catch(next);
    } else {
        setTag(`Authenticated-${requestId}`, true);
        setTag(`UserID-${requestId}`, authUser.id);
        setUser(authUser);

        res.locals.authUser = authUser;
        next();
    }
};

const userRouter = Router();

userRouter.route('').get((_req, res, next) => {
    const randomNum = Math.floor(Math.random() * 1000);
    sleep(randomNum)
        .then(() => {
            captureException(new Error('capturing exception..'), {
                // `extra.expectedUser` should match `event.user`
                // `extra.expectedUser.id` should match `event.tags.UserId`
                extra: { expectedUser: res.locals.authUser, expectedRequestId: res.locals.requestId },
            });
            res.json(Users);
        })
        .catch(next);
});

apiRouter.use('/users', [auth, userRouter]);

app.use('/api', apiRouter);

app.use([
    (err, req, res, next) => {
        if (!res.headersSent) res.status(500).json({ errorMessage: 'Oops!' });

        const { method, originalUrl, params, query, body } = req;
        const { statusCode, locals } = res;
        const eventId = captureException(err, {
            extra: {
                request: { method, originalUrl, params, query, body },
                response: { statusCode, locals },
            },
        });
        (res as { sentry?: string }).sentry = eventId;

        next(err);
    },
]);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running @ http://localhost:${PORT}`);
});
