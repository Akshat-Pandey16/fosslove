import { describe, expect, it } from "vitest";
import { ApiError, isApiError, toApiError } from "./errors";

describe("toApiError", () => {
  it("reads the code, message and request id from the API envelope", () => {
    const error = toApiError(409, {
      error: { code: "conflict", message: "Already exists.", details: null },
      request_id: "req-1",
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe("conflict");
    expect(error.message).toBe("Already exists.");
    expect(error.requestId).toBe("req-1");
  });

  it("falls back to a generic message when the body is not an envelope", () => {
    const error = toApiError(500, "gateway exploded");

    expect(error.code).toBe("error");
    expect(error.message).toBe("Request failed with status 500");
  });

  it("exposes field errors from a 422 validation response", () => {
    const error = toApiError(422, {
      error: {
        code: "validation_error",
        message: "Invalid input.",
        details: { email: ["Enter a valid email address."], password: ["Too short."] },
      },
    });

    expect(error.fieldErrors).toEqual({
      email: ["Enter a valid email address."],
      password: ["Too short."],
    });
    expect(error.firstFieldError()).toBe("Enter a valid email address.");
  });

  it("returns no field errors when details is not a field map", () => {
    const error = toApiError(400, { error: { code: "bad", message: "Bad.", details: [1, 2] } });

    expect(error.fieldErrors).toEqual({});
    expect(error.firstFieldError()).toBeNull();
  });

  it("recognises its own errors", () => {
    expect(isApiError(toApiError(400, undefined))).toBe(true);
    expect(isApiError(new Error("plain"))).toBe(false);
  });
});
