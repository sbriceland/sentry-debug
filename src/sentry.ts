import * as Sentry from '@sentry/node';
import { SentryPropagator, SentrySampler } from '@sentry/opentelemetry';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const release = 'sentry-scope-testing';
const environment = 'local';

const sentryClient = Sentry.init({
    dsn: process.env.SENTRY_DSN,
    beforeSend: (event, hint, ...args) => {
        const { contexts, exception, extra, tags, message, user } = event;
        console.dir(
            {
                whoami: 'sentry:beforeSend',
                event: { contexts, exception, extra, tags, message, user },
                hint,
                args,
            },
            { depth: null }
        );
        return event;
    },
    release,
    environment,
    skipOpenTelemetrySetup: true,
    tracesSampleRate: 1.0,
});

// NOTE: using a custom Sampler as per Sentry's documentation produces same results; Scope is NOT isolated per async
// requests. Setting tags & user bleed into the wrong events

// class AlwaysOnCustomSampler implements Sampler {
//     shouldSample(context: any, _traceId: any, _spanName: any, _spanKind: any, attributes: any, _links: any) {
//         return wrapSamplingDecision({
//             decision: SamplingDecision.RECORD_AND_SAMPLED,
//             context,
//             spanAttributes: attributes,
//         });
//     }

//     toString() {
//         return AlwaysOnCustomSampler.name;
//     }
// }

console.log('sentryClient is defined:', !!sentryClient);
const provider = new NodeTracerProvider({
    sampler: new SentrySampler(sentryClient!),
});

provider.addSpanProcessor(
    // mock processor to avoid polluting console output
    new BatchSpanProcessor({
        export: (_spans, cb) => cb({ code: 0 }),
        shutdown: () => Promise.resolve(),
        forceFlush: () => Promise.resolve(),
    })
);

provider.register({
    propagator: new SentryPropagator(),
    contextManager: new Sentry.SentryContextManager(),
});

registerInstrumentations({
    instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
});

Sentry.validateOpenTelemetrySetup();

export const initializedSentry = Sentry;
