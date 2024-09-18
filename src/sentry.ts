import * as Sentry from '@sentry/node';
import { SentryPropagator } from '@sentry/opentelemetry';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
 import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

const release = 'sentry-scope-testing';
const environment = 'local';

const sentryClient = Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://b5f29bfe807c4898b0f4a155c797c936@o447951.ingest.us.sentry.io/4505583202074624',
    beforeSend: (event) => {
        const {  extra, tags,  user } = event;
        console.dir(
            {
                whoami: 'sentry:beforeSend',
                event: { extra, tags,  user },
            },
            { depth: null }
        );
        return event;
    },
    release,
    environment,
    skipOpenTelemetrySetup: true,
    debug: true
});

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

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
    instrumentations: [new ExpressInstrumentation()],
});

// No need to validate if we do not care about tracing etc.
// Sentry.validateOpenTelemetrySetup();

export const initializedSentry = Sentry;
