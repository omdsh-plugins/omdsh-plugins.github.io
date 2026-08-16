# omdsh-plugins

English | [中文](README.zh.md)

A collection of plugins for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — modes for its web GUI, panels around the conversation, a way onto other machines, a keyboard map, a spend readout, and a hub that installs and configures the rest from inside Settings. Three applications to run them in, and a catalog so the hub can find them.

**Nothing here modifies the harness.** Every feature ships as an out-of-tree bundle that a profile composes over `dsh-base`, through seams the harness already publishes: a slot, a service, a settings namespace, a route. That constraint is the whole design — the harness stays a tracked fork that can follow upstream, and a plugin written next year installs into a profile assembled today without either knowing about the other.

## What is in here

Eleven plugins, three applications, and one catalog.

### Modes — what the middle column is

| Package | What it adds |
|---|---|
| [omdsh-base](https://github.com/omdsh-plugins/omdsh-base) | The session-mode system: the registry every mode plugin registers a segment into, the switch that renders them, and the dots that colour the sidebar by mode. It invents no mode, and contributes one: **Work**, the harness's own column, so a switch always has somewhere to switch back to. |
| [omdsh-justchat](https://github.com/omdsh-plugins/omdsh-justchat) | **Chat** and **Work**. Chat starts a conversation without picking a project directory and keeps those conversations together in a managed workspace. |
| [omdsh-code](https://github.com/omdsh-plugins/omdsh-code) | **Code**. A harness terminal in the conversation's workspace, running as the column rather than beside it. |

### Around the conversation

| Package | What it adds |
|---|---|
| [omdsh-sidepanel](https://github.com/omdsh-plugins/omdsh-sidepanel) | A file tree down the right edge and a terminal along the bottom, in Work mode. |
| [omdsh-sidechat](https://github.com/omdsh-plugins/omdsh-sidechat) | A side conversation summoned anywhere, carrying whatever you were looking at as its anchor. Never touches the conversation you are running. |
| [omdsh-usage](https://github.com/omdsh-plugins/omdsh-usage) | Session spend, project spend, and account balance in the conversation's top row. |
| [omdsh-editor](https://github.com/omdsh-plugins/omdsh-editor) | Open the conversation's directory in the editor, terminal, or file manager you actually use. |

### Reach — other machines

| Package | What it adds |
|---|---|
| [omdsh-remdev](https://github.com/omdsh-plugins/omdsh-remdev) | Attach a workspace to an SSH server, provision a `.dsh-server` there, and run its files, terminals, and agents on that machine. |
| [omdsh-remctrl](https://github.com/omdsh-plugins/omdsh-remctrl) | A second front door on its own port, behind device pairing and a tiered method allowlist, so a phone on your tailnet can watch a session and approve what it asks for. **Status: M0** — the door and the lock. |

### Plumbing

| Package | What it adds |
|---|---|
| [omdsh-plughub](https://github.com/omdsh-plugins/omdsh-plughub) | The plugin hub: a Settings tab that installs and removes these plugins, and configures every installed one from the settings schema it already registers. |
| [omdsh-shortcuts](https://github.com/omdsh-plugins/omdsh-shortcuts) | One chord per command, on the desktop menu and in the page alike — one document, two surfaces. The reference implementation for the conventions. |

### Applications

| Repository | What it is |
|---|---|
| [omdsh-desktop](https://github.com/omdsh-plugins/omdsh-desktop) | An Electron shell that supervises a harness runtime and adds the native surface around it — windows, menus, restart policy, boot screen. |
| [omdsh-tui](https://github.com/omdsh-plugins/omdsh-tui) | An interactive terminal for the harness, shipped as an installable profile bundle. `omdsh-code` runs this in its column. |
| [omdsh-webapp](https://github.com/omdsh-plugins/omdsh-webapp) | A packager that writes the web UI into a double-clickable macOS application: it starts a profile from the Dock, raises the tab already showing it, and stops the server when it quits. |

Each carries a pnpm workspace of its own, which is why none of them is a member of this one. None composes a layer into a profile either, so none appears in the catalog.

**⬇️ Download the desktop application** — nothing else needed on the machine, the runtime and the plugin hub are inside it:
[**macOS** (Apple silicon)](https://github.com/omdsh-plugins/omdsh-desktop/releases/download/v0.1.0-rc.6/DeepSeek-Harness-0.1.0-rc.6-arm64.dmg) · [**Windows** (x64)](https://github.com/omdsh-plugins/omdsh-desktop/releases/download/v0.1.0-rc.6/DeepSeek-Harness-0.1.0-rc.6-x64-setup.exe) · [all releases](https://github.com/omdsh-plugins/omdsh-desktop/releases/latest)

### Catalog

| Directory | What it is |
|---|---|
| [registry/](https://github.com/omdsh-plugins/registry) | A generated manifest of every plugin here, so `omdsh-plughub` can offer them without enumerating a GitHub account one request at a time. |

## How they fit together

```
                    ┌──────────────── omdsh-plughub ────────────────┐
                    │  installs · removes · configures everything   │
                    └───────────────────────────────────────────────┘

  omdsh-base ──── the mode registry, the switch, the dots, and Work
      ├── omdsh-justchat ── Chat · Work
      └── omdsh-code ────── Code

  omdsh-shortcuts ── the `shortcut` service; every chord in the app
  omdsh-remdev ───── the `remdev` service; sidepanel and code ask it about a cwd

  omdsh-sidepanel · omdsh-sidechat · omdsh-usage · omdsh-editor
      surfaces beside the column, each answering for itself when a
      companion is not installed
```

Three services here are published by plugins rather than by the harness: `sessionModes` (omdsh-base), `shortcut` (omdsh-shortcuts), and `remdev` (omdsh-remdev). Whether one exists is a property of the profile a person assembled, so **no plugin names another plugin's service in a top-level `inject`** — it reaches for it inside `apply`, on a restricted fiber, and stays inert when it is absent. One missing companion must never take the page down. That is rule 9 of the [conventions](CONVENTIONS.md), and it is why any subset of this collection composes.

## Install

You need a global [`dsh`](https://github.com/deepseek-ai/deepseek-harness), Node `^22.19.0 || >=24.0.0`, and pnpm 11.7.0.

### From the hub

Install `omdsh-plughub` once, then install everything else from inside Settings:

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-plughub
dsh --profile web
```

Open **Settings → Plugins → OMDSH Plugins**, and the collection is listed with an Install button on each card. The hub reads the [registry](https://github.com/omdsh-plugins/registry) manifest, so a plugin published after you installed the hub still appears.

Every install, update, and removal takes effect on the next start — the hub says so on the card, and the harness's loader does not hot-swap a bundle.

### From the command line

Each plugin installs by name into a profile:

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-base
dsh plugin --profile web add @omdsh-plugins/omdsh-justchat   # Chat and Work
dsh plugin --profile web add @omdsh-plugins/omdsh-code       # Code
```

Order is a readability preference, not a requirement: a plugin composed before the service it wants waits on a restricted fiber rather than failing.

Remove one the same way:

```sh
dsh plugin --profile web remove @omdsh-plugins/omdsh-base
```

### From this checkout

Nothing here is published yet, so a profile assembled today installs from the working tree. Build first — `dsh plugin add` records a `link:` dependency, so the installed files *are* the checkout, and a checkout with no `lib/` cannot be loaded:

```sh
pnpm install
pnpm run build
dsh plugin --profile web add "$PWD/omdsh-base" "$PWD/omdsh-justchat" "$PWD/omdsh-code"
```

`omdsh-tui` is not a workspace member and installs into a profile of its own, which is where `omdsh-code` looks for it:

```sh
cd omdsh-tui && pnpm install && pnpm run install:profile
```

**Code mode needs that profile.** Without it, pressing Code renders `dsh: profile "omdsh-tui" does not exist` inside the terminal column — the rest of the app is unaffected.

### One surface per profile

A profile composes exactly one surface bundle over `dsh-base`. `@deepseek-ai/dsh-web-app` and `@omdsh-plugins/omdsh-tui-app` are both surfaces and collide on seven loader ids, so the terminal lives in its own profile (`omdsh-tui`) and never alongside `web`. The feature plugins in this collection are not surfaces and stack freely.

## Configure

A plugin with anything to configure registers one settings namespace with a [schemastery] schema, and `omdsh-plughub` renders a form from that schema — labels, descriptions, validation, secret redaction, and the base/user layering all come from the harness. **No plugin teaches the hub anything about itself**, which is what lets a plugin installed today get correct labels in both languages without the hub being edited.

Five plugins own a namespace: `omdsh-plughub`, `omdsh-shortcuts`, `omdsh-remdev`, `omdsh-remctrl`, `omdsh-usage`. The rest are configured, where they are configurable at all, in the profile's own `cordis.patch.yml` — each README says which it is.

A field holding a credential is declared `.role('secret')`, stripped from every response, and rendered as a write-only control.

## Commands

From the workspace root, across every member:

```sh
pnpm install
pnpm run build              # tsdown bundles each plugin's host and browser halves
pnpm run typecheck
pnpm run test
pnpm run check:harness-pin  # no plugin is left pointing at a local harness checkout
pnpm run check:registry     # registry.json matches the packages on disk
pnpm run registry:build     # regenerate it
```

`omdsh-desktop`, `omdsh-tui` and `omdsh-webapp` are separate workspaces; run their commands from inside them.

Most plugins also carry `harness:local <path>` and `harness:npm`, which switch their harness dependencies between a sibling checkout and the committed registry pin. `check:harness-pin` fails while anything is still linked — a `link:` specifier hard-codes one machine's layout and fails silently, so it must never reach a commit.

### The browser specs need a harness checkout

`pnpm run test` from the root **does not pass on a fresh clone**, and that is by design rather than a bug: a published harness package ships `lib/` and `.d.ts` but no sources, and its browser half is a loader bundle that expects `window.__ModuleLoader__` — nothing a test runner can import. Each affected package aliases those specifiers to a guard module that throws with instructions, so the node-only specs stay runnable in both modes and only a spec that actually reaches for the harness fails.

To run everything, point the packages at a harness checkout first:

```sh
cd omdsh-base && pnpm run harness:local ../../deepseek-harness && pnpm install
pnpm run test
pnpm run harness:npm && pnpm install     # before committing
```

Because `pnpm -r` stops at the first failing member, a root `pnpm run test` on a pinned tree reports the guard from whichever package it reaches first and never runs the rest. Run it per package while the tree is pinned.

## Known rough edges in the tooling

- **`omdsh-code` and `omdsh-justchat` only build from this workspace, not standalone.** They are the only two packages that depend on another package in the collection (`@omdsh-plugins/omdsh-base`), and nothing here is published yet. From the collection root `linkWorkspacePackages` resolves that to the checkout and everything works; run `pnpm install`, `pnpm test`, or `harness:local` from *inside* either directory and pnpm treats it as its own workspace root, cannot find `omdsh-base` on npm, and fails before doing anything:

  ```
  ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@omdsh-plugins%2Fomdsh-base: Not Found
  ```

  This is the anticipated cost of the `linkWorkspacePackages` + semver arrangement `pnpm-workspace.yaml` explains, and it resolves itself the day `omdsh-base` is published. It is also why those two are the only plugins with no `pnpm-lock.yaml` of their own. Until then, run their commands from the workspace root (`pnpm --filter @omdsh-plugins/omdsh-code run test`).
- **`omdsh-remctrl` and `omdsh-remdev` carry no `harness:local` / `harness:npm` / `check:harness-pin` scripts at all**, so the root `check:harness-pin` sweep passes over them. Neither has browser specs today, which is why it has not bitten — but neither is covered by the guarantee that sweep is there to give.

## Writing a plugin

[CONVENTIONS.md](CONVENTIONS.md) is the contract: nine rules, a checklist, and a worked example. It is short because the rules are almost all "use the seam the harness already has". [README-STYLE.md](README-STYLE.md) is the documentation half — what every README here agrees to look like.

`omdsh-shortcuts` is the reference implementation. Reading its `src/bindings.ts` and the settings block at the end of its `src/index.ts` is the shortest route to writing the same thing for another plugin.

## Known limitations

- **Nothing is published to npm yet.** Every `@omdsh-plugins/…` name in this document resolves from the registry once these are released; today they install from a checkout, and the hub reports such an install as `linked` rather than up to date, because there was never anything to fetch.
- **Installs need a restart.** The loader composes a profile at boot; nothing here hot-swaps a bundle.
- **The hub's write routes are loopback-only.** A `dsh web` served to another host can browse the catalog but cannot install from it.
- **Some surfaces are borrowed, not owned.** The mode switch anchors itself to a published attribute on the conversation column, the sidebar dots are painted onto the harness's own rows, and two plugins portal into DOM anchors. Each degrades to nothing rather than to something wrong when the markup underneath changes — but each is a selector this collection has to follow.
- **`omdsh-remctrl` is at M0**: the port, the pairing, and the allowlist, with no desktop panel yet.

[schemastery]: https://github.com/shigma/schemastery
