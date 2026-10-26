import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "bun:test";
import { findModTests, runModTests } from "./mod-tests.mjs";

function fixture(
  run: (root: string, mod: string, put: (file: string, content?: string) => void) => void,
) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "sandustry-mod-tests-")));
  const mod = join(root, "mods/example");
  function put(file: string, content = "") {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  mkdirSync(mod, { recursive: true });
  try {
    run(root, mod, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("mod test discovery separates suites and ignores generated and dependency tests", () => {
  fixture((_root, mod, put) => {
    put("mods/example/tests/unit.test.ts");
    put("mods/example/__tests__/game.integration.test.ts");
    put("mods/example/build/generated.test.ts");
    put("mods/example/node_modules/dependency/test.test.ts");
    put("mods/other/tests/other.test.ts");
    assert.deepEqual(findModTests(mod), {
      unit: [join(mod, "tests/unit.test.ts")],
      integration: [join(mod, "__tests__/game.integration.test.ts")],
    });
  });
});

test("selected mod runs units before integration without ambient mod or name filters", () => {
  fixture((root, mod, put) => {
    put("mods/example/unit.test.ts");
    put("mods/example/game.integration.test.ts");
    const calls: Array<{ command: string; args: string[] }> = [];
    runModTests(mod, {
      root,
      env: { SEARCH: "skip everything", SANDUSTRY_MOD: "other" },
      run(command, args, options) {
        assert.equal(options.cwd, root);
        assert.equal(options.env.SEARCH, undefined);
        assert.equal(options.env.SANDUSTRY_MOD, "example");
        calls.push({ command, args });
        return { status: 0 };
      },
    });
    assert.deepEqual(calls, [
      { command: "bun", args: ["test", join(mod, "unit.test.ts")] },
      {
        command: process.execPath,
        args: [join(root, "scripts/test/sandustry-integration.mjs"), "--mod", "example"],
      },
    ]);
  });
});

test("failed unit tests stop before integration and missing runners fail closed", () => {
  fixture((root, mod, put) => {
    put("mods/example/unit.test.ts");
    put("mods/example/game.integration.test.ts");
    let calls = 0;
    assert.throws(
      () =>
        runModTests(mod, {
          root,
          run() {
            calls++;
            return { status: 1 };
          },
        }),
      /unit tests failed/,
    );
    assert.equal(calls, 1);
    assert.throws(
      () =>
        runModTests(mod, {
          root,
          run() {
            return { error: new Error("runner unavailable") };
          },
        }),
      /runner unavailable/,
    );
  });
});

test("mods without tests do not invoke a runner", () => {
  fixture((root, mod) => {
    assert.deepEqual(
      runModTests(mod, {
        root,
        run() {
          throw new Error("unexpected runner");
        },
      }),
      { unit: [], integration: [] },
    );
  });
});

for (const status of [0, 1]) {
  test(`publisher ${status === 0 ? "uploads only after passing" : "blocks upload after failing"} mod tests`, () => {
    fixture((root, mod, put) => {
      put(
        "mods/example/modinfo.json",
        JSON.stringify({ id: "example", name: "Example", version: "1.0.0" }),
      );
      put("mods/example/build/package/entry.js");
      put("mods/example/game.integration.test.ts");
      put("workshop-published-ids.json", JSON.stringify({ example: "123" }));
      put(
        "scripts/test/sandustry-integration.mjs",
        `
        import { appendFileSync } from 'node:fs';
        if (process.env.SEARCH || process.env.SANDUSTRY_MOD !== 'example' ||
            JSON.stringify(process.argv.slice(2)) !== '["--mod","example"]') process.exit(2);
        appendFileSync(process.env.TEST_EVENTS, 'tests\\n');
        process.exit(${status});
      `,
      );
      put("scripts/test/mod-tests.mjs");
      copyFileSync(resolve("scripts/test/mod-tests.mjs"), join(root, "scripts/test/mod-tests.mjs"));
      copyFileSync(
        resolve("scripts/publish-workshop.mjs"),
        join(root, "scripts/publish-workshop.mjs"),
      );
      const steamcmd = join(root, "fake-steamcmd");
      put(
        "fake-steamcmd",
        `#!${process.execPath}\nrequire('node:fs').appendFileSync(process.env.TEST_EVENTS, 'upload\\n');\n`,
      );
      chmodSync(steamcmd, 0o755);
      const events = join(root, "events.txt");
      const result = spawnSync(
        process.execPath,
        [join(root, "scripts/publish-workshop.mjs"), mod, join(mod, "build/package")],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            STEAMCMD: steamcmd,
            STEAM_ACCOUNT: "fixture",
            SEARCH: "no matching tests",
            SANDUSTRY_MOD: "other",
            TEST_EVENTS: events,
          },
        },
      );
      assert.equal(result.status, status, `${result.stdout}\n${result.stderr}`);
      assert.equal(readFileSync(events, "utf8"), status === 0 ? "tests\nupload\n" : "tests\n");
      if (status !== 0)
        assert.match(result.stderr, /Publishing stopped: example integration tests failed/);
    });
  });
}
