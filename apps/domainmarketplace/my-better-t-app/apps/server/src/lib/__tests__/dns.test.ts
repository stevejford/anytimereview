import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
	normalizeHostname,
	normalizeDnsTarget,
	matchesExpectedCname,
} from "../dns.js";

describe("normalizeHostname", () => {
	it("lowercases and strips trailing dots", () => {
		assert.equal(normalizeHostname("Example.COM."), "example.com");
	});

	it("extracts hostname from URLs", () => {
		assert.equal(
			normalizeHostname("https://WWW.EXAMPLE.COM/path"),
			"www.example.com",
		);
	});

	it("removes wrapping quotes", () => {
		assert.equal(normalizeHostname('"foo.bar."'), "foo.bar");
	});
});

describe("normalizeDnsTarget", () => {
	it("combines strip and normalize", () => {
		assert.equal(
			normalizeDnsTarget('"CNAME.Target.COM."'),
			"cname.target.com",
		);
	});
});

describe("matchesExpectedCname", () => {
	it("returns true when any record matches expected target", () => {
		const records = ["ALIAS.EXAMPLE.com.", "cname.target.com."];
		assert.equal(matchesExpectedCname(records, "CNAME.Target.com"), true);
	});

	it("returns false when expected target is absent", () => {
		const records = ["other.example.com."];
		assert.equal(
			matchesExpectedCname(records, "expected.example.com"),
			false,
		);
	});

	it("returns false when expected target is undefined", () => {
		const records = ["example.com."];
		assert.equal(matchesExpectedCname(records, undefined), false);
	});
});
