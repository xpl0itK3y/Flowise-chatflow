export class FlowiseTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Flowise response timed out after ${timeoutMs}ms`);
  }
}

export class FlowiseUnavailableError extends Error {
  constructor(message = 'Flowise API is unavailable') {
    super(message);
  }
}

export class EmptyLlmResponseError extends Error {
  constructor() {
    super('LLM returned an empty response');
  }
}

export class InvalidLlmJsonError extends Error {
  constructor(message = 'LLM returned invalid JSON') {
    super(message);
  }
}

