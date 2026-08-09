import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

/**
 * Regression guard for the INVALID_MESSAGE: UNCLOSED_TAG dashboard crash: the
 * i18n tag parser treats `<name>` / `<provider>` / `<model>` / `<app-name>` /
 * `<org-slug>` / `<gateway-alias>` as HTML-ish tags, so any *unclosed* literal
 * token in a message value throws while rendering (e.g. the Feature Flags grid
 * calls `t()` on every flag description and one bad string nuked the whole
 * page). Literal tokens MUST be HTML-escaped (`&lt;name&gt;`); balanced pairs
 * like `<code>…</code>` are legitimate and must keep working.
 */

const MESSAGES_DIR = path.resolve("src/i18n/messages");

type MessageTree = Record<string, unknown>;
type MessageEntry = { key: string; value: string };

// A tag is an opening `<name>` or closing `</name>`. `&lt;…&gt;` never matches
// because the string contains no raw `<`.
const TAG_PATTERN = /<(\/)?([A-Za-z_][\w-]*)>/g;

/** Returns the first unclosed (or mismatched) tag, or null when balanced. */
function unclosedTag(value: string): string | null {
  const stack: string[] = [];
  for (const match of value.matchAll(TAG_PATTERN)) {
    const [, closing, name] = match;
    if (closing) {
      if (stack.length > 0 && stack[stack.length - 1] === name) {
        stack.pop();
      } else {
        return `</${name}>`;
      }
    } else {
      stack.push(name);
    }
  }
  return stack.length > 0 ? `<${stack[stack.length - 1]}>` : null;
}

function* walk(value: unknown, segments: string[] = []): Generator<MessageEntry> {
  if (typeof value === "string") {
    yield { key: segments.join("."), value };
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      yield* walk(value[index], [...segments, String(index)]);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as MessageTree)) {
      yield* walk(child, [...segments, key]);
    }
  }
}

const localeFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();

describe("i18n message catalog has no unclosed tags", () => {
  it("loads every locale file as valid JSON", () => {
    for (const file of localeFiles) {
      const raw = fs.readFileSync(path.join(MESSAGES_DIR, file), "utf8");
      assert.doesNotThrow(
        () => JSON.parse(raw),
        `${file} should parse as JSON`
      );
    }
  });

  for (const file of localeFiles) {
    it(`${file} has no string with an unclosed tag`, () => {
      const messages = JSON.parse(
        fs.readFileSync(path.join(MESSAGES_DIR, file), "utf8")
      ) as MessageTree;

      for (const { key, value } of walk(messages)) {
        const bad = unclosedTag(value);
        assert.equal(
          bad,
          null,
          `${file} "${key}" contains unclosed tag ${bad}: ${value.slice(0, 120)}`
        );
      }
    });
  }
});

describe("literal path/alias tokens in UI strings stay HTML-escaped", () => {
  it("escapes <name> in the Claude profiles auto-sync description", () => {
    const en = JSON.parse(
      fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf8")
    ) as MessageTree;
    const definitions =
      ((en.featureFlags as MessageTree | undefined)?.definitions as MessageTree | undefined) ??
      {};
    const autoSyncClaude = definitions.OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES as
      | MessageTree
      | undefined;

    assert.match(
      String(autoSyncClaude?.description ?? ""),
      /~\/\.claude\/profiles\/&lt;name&gt;\/settings\.json/
    );
  });

  it("escapes <provider>/<model> in the Claude Code discovery alias strings", () => {
    const en = JSON.parse(
      fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf8")
    ) as MessageTree;

    assert.match(
      String(en.featureFlagExposeCcDiscoveryAliasesDescription ?? ""),
      /claude\/&lt;provider&gt;\/&lt;model&gt;/
    );
    assert.match(
      String(en.featureFlagExposeFunctionalGatewayMirrorsDescription ?? ""),
      /&lt;gateway-alias&gt;\/&lt;model&gt;/
    );
  });

  it("escapes <app-name>.<org-slug> in the Deno Relay domain hint", () => {
    const en = JSON.parse(
      fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf8")
    ) as MessageTree;
    const settings = en.settings as MessageTree | undefined;

    assert.match(
      String(settings?.denoRelayOrgDomainHint ?? ""),
      /https:\/\/&lt;app-name&gt;\.&lt;org-slug&gt;\.deno\.net/
    );
  });
});
