import * as Sentry from '@sentry/node';

import type { ScopeContext } from '@sentry/core';

type CaptureExceptionContext = Partial<Pick<ScopeContext, 'contexts' | 'extra' | 'level' | 'tags' | 'user'>>;

export const captureException = (err: unknown, ctx?: CaptureExceptionContext) => {
    return Sentry.captureException(err, {
        contexts: ctx?.contexts,
        extra: ctx?.extra,
        level: ctx?.level,
        user: ctx?.user,
    });
};

export const captureMessage = Sentry.captureMessage;
export const setTag = Sentry.setTag;
export const setUser = Sentry.setUser;
