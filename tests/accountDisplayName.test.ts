import assert from "node:assert/strict";
import test from "node:test";
import { resolveAccountDisplayName } from "../src/lib/accountDisplayName.ts";

test("prefers a saved profile display name", () => {
  assert.equal(
    resolveAccountDisplayName({
      profileDisplayName: "Aryan Kedare",
      userMetadata: { full_name: "Google Name" },
      email: "arykedare@gmail.com",
    }),
    "Aryan Kedare",
  );
});

test("uses Google metadata when the profile contains a generic fallback", () => {
  assert.equal(
    resolveAccountDisplayName({
      profileDisplayName: "arykedare",
      userMetadata: { full_name: "Aryan Kedare" },
      email: "arykedare@gmail.com",
    }),
    "Aryan Kedare",
  );
});

test("never displays the full email as the account label", () => {
  assert.equal(
    resolveAccountDisplayName({
      profileDisplayName: "arykedare@gmail.com",
      email: "arykedare@gmail.com",
    }),
    "arykedare",
  );
});
