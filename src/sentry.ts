import * as Sentry from '@sentry/node';
import type { ScopeContext } from '@sentry/types';
import { SentryPropagator, wrapSamplingDecision } from '@sentry/opentelemetry';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { BatchSpanProcessor, Sampler, SamplingDecision } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { RequestHandler } from 'express';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const release = 'sentry-scope-testing';
const environment = 'local';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    beforeSend: (event) => {
        const { extra, tags, user } = event;
        console.dir(
            {
                whoami: 'sentry:beforeSend',
                event: { extra, tags, user },
            },
            { depth: null }
        );
        return event;
    },
    release,
    environment,
    skipOpenTelemetrySetup: true,
    // IF `tracesSampleRate` and `dsn` are set, HttpInstrumentation and ExpressInstrumentation will be registered for OTEL
    // IF `tracesSampleRate` is set and `dsn` is NOT set, HttpInstrumentation and ExpressInstrumentation will be registered for OTEL
    // IF `tracesSampleRate` is NOT set AND `dsn` is set: only HttpInstrumentation will be registered for OTEL
    // IF `tracesSampleRate` is NOT set and `dsn` is NOT set: no instrumentation is registered
    // Since Sentry minimally needs HttpInstrumentation to work, we've decided to let Sentry register Http & Express
    // by setting `tracesSampleRate`
    tracesSampleRate: 1.0,
});

/**
 * Sentry recommended custom Sampler that behaves similar to the standard AlwaysOnSampler
 */
class AlwaysOnCustomSampler implements Sampler {
    shouldSample(context: any, _traceId: any, _spanName: any, _spanKind: any, attributes: any, _links: any) {
        return wrapSamplingDecision({
            decision: SamplingDecision.RECORD_AND_SAMPLED,
            context,
            spanAttributes: attributes,
        });
    }

    toString() {
        return AlwaysOnCustomSampler.name;
    }
}

const provider = new NodeTracerProvider({
    sampler: new AlwaysOnCustomSampler(),
});

provider.addSpanProcessor(
    // mock processor to avoid polluting console output
    new BatchSpanProcessor({
        export: (spans, cb) => {
            console.dir(
                spans.map(({ name, attributes }) => ({ name, attributes })),
                { depth: null }
            );
            cb({ code: 0 });
        },
        shutdown: () => Promise.resolve(),
        forceFlush: () => Promise.resolve(),
    })
);

provider.register({
    propagator: new SentryPropagator(),
    contextManager: new Sentry.SentryContextManager(),
});

export const setupIsolationScopeMiddleware: RequestHandler = (_req, _res, next) => {
    // Try/Catch probably a bit too cautious, but since this runs for every request, let's make sure safely continue on
    // only downside is we'll lose proper isolated scoping in the event we report an exception for the request.
    try {
        Sentry.withIsolationScope(() => {
            next();
        });
    } catch (err) {
        Sentry.captureException(err);
        next();
    }
};

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
