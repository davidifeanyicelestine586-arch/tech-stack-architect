import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROLE, getUserRole, isAdminUser } from "../lib/auth/authorization.js";

test("admin authorization accepts only the explicit admin app_metadata role", () => {
  assert.equal(getUserRole({ app_metadata: { role: ADMIN_ROLE } }), ADMIN_ROLE);
  assert.equal(isAdminUser({ app_metadata: { role: ADMIN_ROLE } }), true);
  assert.equal(isAdminUser({ app_metadata: { role: "user" } }), false);
  assert.equal(isAdminUser({ app_metadata: {} }), false);
  assert.equal(isAdminUser({}), false);
  assert.equal(isAdminUser(null), false);
});

test("authorization never treats an arbitrary profile field as an admin role", () => {
  assert.equal(isAdminUser({ user_metadata: { role: ADMIN_ROLE } }), false);
  assert.equal(isAdminUser({ app_metadata: { admin: true } }), false);
});
