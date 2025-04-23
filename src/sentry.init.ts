import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, Sampler, SamplingDecision, SamplingResult } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/node';
import { SentryPropagator, wrapSamplingDecision } from '@sentry/opentelemetry';

import type { Context, Attributes } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const DSN = process.env.SENTRY_DSN;
if (!DSN) console.warn('process.env.SENTRY_DSN is not set. Sentry will not be initialized.');

const release = 'sentry-scope-testing';
const environment = 'local';

Sentry.init({
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
    dsn: DSN,
    environment,
    initialScope: { tags: { APP_VERSION: undefined } },
    // NOTE: it's important to make sure that the default integrations is included. So if you need to overwrite or add
    // add custom integrations, make sure to include the existing integrations.
    //
    // The main reason for this is to make sure Sentry.httpIntegration is included. The Sentry.httpIntegration can be
    // included here as well as when registering the OpenTelemetry instrumentations (see below).
    integrations: (integrations) => [...integrations, Sentry.httpIntegration({ spans: false })],
    normalizeDepth: 10,
    release,
    skipOpenTelemetrySetup: true,
});

/**
 * Sentry recommended custom Sampler that behaves similar to the standard AlwaysOnSampler
 */
class AlwaysOnCustomSampler implements Sampler {
    shouldSample(
        context: Context,
        _traceId: unknown,
        _spanName: unknown,
        _spanKind: unknown,
        spanAttributes: Attributes,
        _links: unknown
    ): SamplingResult {
        return wrapSamplingDecision({ context, decision: SamplingDecision.RECORD_AND_SAMPLED, spanAttributes });
    }

    toString() {
        return AlwaysOnCustomSampler.name;
    }
}

const provider = new NodeTracerProvider({
    sampler: new AlwaysOnCustomSampler(),
    resource: new Resource({
        [ATTR_SERVICE_NAME]: 'sentry-debug-api',
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
    }),
    spanProcessors: [
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
        }),
    ],
});

// Initialize & Register this provider with the OpenTelemetry API as the global tracer provider
provider.register({
    propagator: new SentryPropagator(),
    contextManager: new Sentry.SentryContextManager(),
});

// register and load instrumentation and plugins
registerInstrumentations({
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

export const TelemetryInfo = {
    sentryEnabled: !!DSN,
    tracerProviderEnabled: !!provider,
} as const;
