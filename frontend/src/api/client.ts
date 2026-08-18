const DEFAULT_API_URL = "http://localhost:5050";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, "");

type RequestFailureKind = "aborted" | "network" | "response" | "timeout";

export class ApiError extends Error {
    readonly kind: RequestFailureKind;
    readonly status: number | null;

    constructor(message: string, kind: RequestFailureKind, status: number | null = null) {
        super(message);
        this.name = "ApiError";
        this.kind = kind;
        this.status = status;
    }
}

interface RequestJsonOptions extends RequestInit {
    timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readServerMessage(payload: unknown): string | null {
    if (!isRecord(payload)) return null;

    const message = payload.error ?? payload.message;
    return typeof message === "string" && message.trim() ? message.trim() : null;
}

function fallbackMessage(status: number) {
    if (status === 401) return "Your session is no longer valid. Sign in and try again.";
    if (status === 413) return "That PDF is larger than the 10 MB upload limit.";
    if (status === 422) return "We could not find enough readable text in that PDF.";
    if (status >= 500) return "The service could not complete that request. Please try again.";
    return "The request could not be completed. Please check your details and try again.";
}

export async function requestJson<T>(path: string, options: RequestJsonOptions = {}): Promise<T> {
    const { timeoutMs = 20_000, signal: externalSignal, ...requestOptions } = options;
    const controller = new AbortController();
    let timedOut = false;

    const abortFromCaller = () => controller.abort();
    if (externalSignal?.aborted) {
        controller.abort();
    } else {
        externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...requestOptions,
            signal: controller.signal,
        });

        const rawBody = await response.text();
        let payload: unknown = null;

        if (rawBody) {
            try {
                payload = JSON.parse(rawBody) as unknown;
            } catch {
                payload = rawBody;
            }
        }

        if (!response.ok) {
            const serverMessage = readServerMessage(payload);
            const message = serverMessage || fallbackMessage(response.status);

            throw new ApiError(message, "response", response.status);
        }

        return payload as T;
    } catch (error) {
        if (error instanceof ApiError) throw error;

        if (controller.signal.aborted) {
            throw new ApiError(
                timedOut
                    ? "The request took too long. Please try again."
                    : "The request was cancelled.",
                timedOut ? "timeout" : "aborted",
            );
        }

        throw new ApiError(
            "We could not reach the service. Check that the backend is running, then try again.",
            "network",
        );
    } finally {
        window.clearTimeout(timeoutId);
        externalSignal?.removeEventListener("abort", abortFromCaller);
    }
}

export function isRecordResponse(value: unknown): value is Record<string, unknown> {
    return isRecord(value);
}
