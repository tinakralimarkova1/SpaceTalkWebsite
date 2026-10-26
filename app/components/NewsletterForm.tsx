"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type SubmissionState = {
  message: string;
  type: "idle" | "error" | "success";
};

const initialState: SubmissionState = {
  message: "",
  type: "idle",
};

function readMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "";
}

export function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmission(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/newsletter", {
        body: JSON.stringify({
          email: formData.get("email"),
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          organization: formData.get("organization"),
          website: formData.get("website"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);
      const message = readMessage(payload);

      if (!response.ok) {
        throw new Error(message || "The signup could not be completed.");
      }

      form.reset();
      setSubmission({
        message: message || "Thank you. You have joined the mailing list.",
        type: "success",
      });
    } catch (error) {
      setSubmission({
        message:
          error instanceof Error
            ? error.message
            : "The signup could not be completed. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <p>
        If you want to receive updates about future NYU Space Talks, please join
        our mailing list.
      </p>
      <label>
        First Name
        <input autoComplete="given-name" name="firstName" maxLength={80} required type="text" />
      </label>
      <label>
        Last Name
        <input autoComplete="family-name" name="lastName" maxLength={80} required type="text" />
      </label>
      <label>
        Organization
        <input autoComplete="organization" name="organization" maxLength={160} type="text" />
      </label>
      <label>
        Email
        <input autoComplete="email" name="email" maxLength={254} required type="email" />
      </label>
      <label aria-hidden="true" className="honeypot-field">
        Website
        <input autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <p
        aria-live="polite"
        className={`form-status ${submission.type}`}
        role="status"
      >
        {submission.message}
      </p>
    </form>
  );
}
