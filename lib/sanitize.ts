/**
 * Sanitize untrusted HTML — OWASP A03:2021 XSS prevention.
 * Used for Tiptap/rich-text editor output, task descriptions, and comments.
 */

import DOMPurify from "dompurify";

/**
 * Full rich-text config — matches Tiptap's output tag set.
 * Allows all common document structure tags but strips scripts and event handlers.
 */
const RICH_TEXT_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [
        "p", "br", "b", "i", "em", "strong", "s", "u", "code", "pre",
        "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4",
        "span", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
        "hr", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "width", "height", "data-type", "data-id"],
    FORCE_BODY: true,
};

const PLAIN_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
};

/**
 * Sanitize Tiptap HTML output before rendering task descriptions or comments.
 * Forces external links to open safely with rel="noopener noreferrer".
 */
export function sanitizeHtml(dirty: string): string {
    if (typeof window === "undefined") return stripHtml(dirty);
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "A") {
            node.setAttribute("target", "_blank");
            node.setAttribute("rel", "noopener noreferrer");
        }
    });
    const clean = DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG) as string;
    DOMPurify.removeHook("afterSanitizeAttributes");
    return clean;
}

/**
 * Strip all HTML — returns plain text.
 * Works in both browser and SSR/Node contexts.
 */
export function stripHtml(dirty: string): string {
    if (typeof window === "undefined") {
        return dirty.replace(/<[^>]*>/g, "");
    }
    return DOMPurify.sanitize(dirty, PLAIN_CONFIG) as string;
}
