"use client";

/**
 * NexusFlow — Core Web Vitals reporter
 *
 * Reports LCP, INP, CLS, FCP, TTFB to PostHog for real-user monitoring.
 * Skill coverage: web-vitals v4, Core Web Vitals, PostHog RUM
 */

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import posthog from "posthog-js";

function sendToPostHog(metric: Metric) {
    posthog.capture("web_vital", {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta),
        metric_id: metric.id,
        navigation_type: metric.navigationType,
        $current_url: window.location.href,
    });
}

export function WebVitalsReporter() {
    useEffect(() => {
        onCLS(sendToPostHog);
        onFCP(sendToPostHog);
        onINP(sendToPostHog);
        onLCP(sendToPostHog);
        onTTFB(sendToPostHog);
    }, []);

    return null;
}
