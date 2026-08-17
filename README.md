# omdsh-plugins

English | [中文](README.zh.md)

A collection of plugins for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — modes for its web GUI, panels around the conversation, two ways to hand it something it cannot read on its own (documents, pictures), a way onto other machines, a keyboard map, two top-row readouts (spend, project status), and a hub that installs and configures the rest from inside Settings. Three applications to run them in, and a catalog so the hub can find them.

**Nothing here modifies the harness.** Every feature ships as an out-of-tree bundle that a profile composes over `dsh-base`, through seams the harness already publishes: a slot, a service, a settings namespace, a route. That constraint is the whole design — the harness stays a tracked fork that can follow upstream, and a plugin written next year installs into a profile assembled today without either knowing about the other.

## What is in here

Fourteen plugins, three applications, and one catalog.

### Modes — what the middle column is

| Package | What it adds |
|---|---|
| [omdsh-base](https://github.com/omdsh-plugins/omdsh-base) | The session-mode system: the registry every mode plugin registers a segment into, the switch that renders them, and the dots that colour the sidebar by mode. It invents no mode, and contributes one: **Work**, the harness's own column, so a switch always has somewhere to switch back to. |
| [omdsh-chatmode](https://github.com/omdsh-plugins/omdsh-chatmode) | **Chat** and **Work**. Chat starts a conversation without picking a project directory and keeps those conversations together in a managed workspace. |
| [omdsh-codemode](https://github.com/omdsh-plugins/omdsh-codemode) | **Code**. A harness terminal in the conversation's workspace, running as the column rather than beside it. |

### Around the conversation

| Package | What it adds |
|---|---|
| [omdsh-sidepanel](https://github.com/omdsh-plugins/omdsh-sidepanel) | A file tree down the right edge and a terminal along the bottom, in Work mode. |
| [omdsh-sidechat](https://github.com/omdsh-plugins/omdsh-sidechat) | A side conversation summoned anywhere, carrying whatever you were looking at as its anchor. Never touches the conversation you are running. |
| [omdsh-usage](https://github.com/omdsh-plugins/omdsh-usage) | Session spend, project spend, and account balance in the conversation's top row. |
| [omdsh-status](https://github.com/omdsh-plugins/omdsh-status) | The current project's name with its git branch and change counts, at the right end of the conversation's top row. |
| [omdsh-editor](https://github.com/omdsh-plugins/omdsh-editor) | Open the conversation's directory in the editor, terminal, or file manager you actually use. |

### What the model can read

A DeepSeek route carries text and nothing else. These two hand it the rest of what a person has on their desk, by turning it into text before it gets there.

| Package | What it adds |
|---|---|
| [omdsh-office](https://github.com/omdsh-plugins/omdsh-office) | Attach a Word file, a deck, a spreadsheet, a PDF or any text file — from a button beside the composer's plus or by dropping it on the window — and its text goes with the message. |
| [omdsh-eyes](https://github.com/omdsh-plugins/omdsh-eyes) | Sight, from a vision model you configure: `see_image` and `watch_video` for a file, `ask_image` for a closer look, and a mirrored model route so a pasted picture is described on its way out. |

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
| [omdsh-tui](https://github.com/omdsh-plugins/omdsh-tui) | An interactive terminal for the harness, shipped as an installable profile bundle. `omdsh-codemode` runs this in its column. |
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
      ├── omdsh-chatmode ── Chat · Work
      └── omdsh-codemode ── Code

  omdsh-shortcuts ── the `shortcut` service; every chord in the app
  omdsh-remdev ───── the `remdev` service; sidepanel and codemode ask it about a cwd

  omdsh-sidepanel · omdsh-sidechat · omdsh-usage · omdsh-editor
  omdsh-status
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

Open **Settings → Plugins → Plugin hub**, and the collection is listed with an Install button on each card. The hub reads the [registry](https://github.com/omdsh-plugins/registry) manifest, so a plugin published after you installed the hub still appears.

Every install, update, and removal takes effect on the next start — the hub says so on the card, and the harness's loader does not hot-swap a bundle.

### From the command line

The hub ships a command, and it installs anything in the catalog by name:

```sh
npx @omdsh-plugins/omdsh-plughub list                       # what is on offer
npx @omdsh-plugins/omdsh-plughub add omdsh-base omdsh-chatmode omdsh-codemode
npx @omdsh-plugins/omdsh-plughub remove omdsh-codemode
```

That is the Settings tab's installer with argv where the button was — the same catalog, the same specifier, the same `dsh plugin` underneath — so a plugin added this way is the same dependency and the same bundle row. It writes into the `web` profile unless `--profile` says otherwise, and that profile has to exist first: `dsh --profile web` writes one.

Ten of the twelve are why it exists. They are not on npm, so `dsh plugin --profile web add @omdsh-plugins/omdsh-chatmode` answers `ERR_PNPM_FETCH_404` and changes nothing — the profile is left exactly as it was. The git specifier that would work needs a pnpm build-allowlist key carrying the commit pnpm resolved, which can be copied out of a failure and never written down in advance; the command writes it for you.

`omdsh-base` and `omdsh-plughub` are on npm, so those two also install the plain way:

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-base
```

Order is a readability preference, not a requirement: a plugin composed before the service it wants waits on a restricted fiber rather than failing.

**A version published in the last 24 hours does not install by name — through `dsh plugin`.** That is pnpm's caution and not npm's, so the `npx` line above is unaffected. pnpm holds a fresh release at arm's length — `minimumReleaseAge` defaults to a day — so an `add` run the morning after a release quietly records the version *before* it, and the hub then offers an update to the one you thought you asked for. Name the version, or waive the delay for that one command:

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-base@<version>
dsh plugin --profile web add @omdsh-plugins/omdsh-base --config.minimumReleaseAge=0
```

The `minimumReleaseAge: 0` in this workspace's `pnpm-workspace.yaml` does not reach that install: the profile directory is its own pnpm root and inherits nothing from here.

Remove one the same way:

```sh
dsh plugin --profile web remove @omdsh-plugins/omdsh-base
```

### From this checkout

Most of this is not published yet, and a plugin you are changing is never the published one, so a profile assembled here installs from the working tree. Build first — `dsh plugin add` records a `link:` dependency, so the installed files *are* the checkout, and a checkout with no `lib/` cannot be loaded:

```sh
pnpm install
pnpm run build
dsh plugin --profile web add "$PWD/omdsh-base" "$PWD/omdsh-chatmode" "$PWD/omdsh-codemode"
```

`omdsh-tui` is not a workspace member and installs into a profile of its own, which is where `omdsh-codemode` looks for it:

```sh
cd omdsh-tui && pnpm install && pnpm run install:profile
```

**Code mode needs that profile.** Without it, pressing Code renders `dsh: profile "omdsh-tui" does not exist` inside the terminal column — the rest of the app is unaffected.

### One surface per profile

A profile composes exactly one surface bundle over `dsh-base`. `@deepseek-ai/dsh-web-app` and `@omdsh-plugins/omdsh-tui-app` are both surfaces and collide on seven loader ids, so the terminal lives in its own profile (`omdsh-tui`) and never alongside `web`. The feature plugins in this collection are not surfaces and stack freely.

## Configure

A plugin with anything to configure registers one settings namespace with a [schemastery] schema, and `omdsh-plughub` renders a form from that schema — labels, descriptions, validation, secret redaction, and the base/user layering all come from the harness. **No plugin teaches the hub anything about itself**, which is what lets a plugin installed today get correct labels in both languages without the hub being edited.

Seven plugins own a namespace: `omdsh-plughub`, `omdsh-shortcuts`, `omdsh-remdev`, `omdsh-remctrl`, `omdsh-usage`, `omdsh-office`, `omdsh-eyes`. The rest are configured, where they are configurable at all, in the profile's own `cordis.patch.yml` — each README says which it is.

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
pnpm run check:docs         # the site and these READMEs still match the registry
pnpm run profile:build      # write the organisation's front page from this README
pnpm run check:profile      # it is not behind this README
```

`omdsh-desktop`, `omdsh-tui` and `omdsh-webapp` are separate workspaces; run their commands from inside them.

Most plugins also carry `harness:local <path>` and `harness:npm`, which switch their harness dependencies between a sibling checkout and the committed registry pin. `check:harness-pin` fails while anything is still linked — a `link:` specifier hard-codes one machine's layout and fails silently, so it must never reach a commit.

### The three documents that describe this collection

The same collection is introduced three times over — the site under `docs/`, these two READMEs, and [github.com/omdsh-plugins](https://github.com/omdsh-plugins) — and nothing renders any of them from the others. Two commands are what keep them from saying different things.

`check:docs` compares what the site and both READMEs claim — the catalog cards, their versions and categories, the counts, the release links, the toolchain versions, the nine rules — against `registry/registry.json` and the root manifest, and prints the file and line of anything that disagrees. It generates nothing: the site argues a case the READMEs do not, and a generator would flatten both. It only refuses to let them contradict a fact recorded somewhere else.

It holds the documents here to [README-STYLE.md](README-STYLE.md) as well, and reads that contract *out of* the document rather than restating it: the language switcher comes from the code blocks in its rule on line 3, the fixed Chinese section names from its table of them. A style document some script paraphrases is two documents. What is enforced is the structural half — line 3, the heading skeleton, no license section, no skipped level, limitations last, and the two languages having the same headings, in the same order, with the same code blocks. Sentence case is deliberately left alone: the rule admits proper nouns and quoted UI strings, so a check for it would shout at correct headings, and a check nobody trusts gets turned off. It reaches the six documents in this repository and no further — every plugin README the style is really addressed to lives in a repository of its own.

The organisation's front page is generated, because GitHub reads it from a repository named `.github` and nothing else can put anything there — so it would otherwise be a second copy of an introduction that already exists. `profile:build` cuts this README at **Commands** (everything below is for somebody who already cloned), makes the relative links absolute, since they resolve against that other repository, and writes the result into a checkout of it:

```sh
git clone https://github.com/omdsh-plugins/.github.git org-profile
pnpm run profile:build
```

Pushing that checkout is what changes the page, which makes editing this README two pushes, the way a release is. `check:profile` fails while the page is behind.

Both are what CI runs, and all it runs: everything else here reads the plugin checkouts, and every one of those is a repository of its own, absent from a clone of this one.

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

- **`omdsh-codemode` and `omdsh-chatmode` only build from this workspace, not standalone.** They are the only two packages that depend on another package in the collection (`@omdsh-plugins/omdsh-base`), and nothing here is published yet. From the collection root `linkWorkspacePackages` resolves that to the checkout and everything works; run `pnpm install`, `pnpm test`, or `harness:local` from *inside* either directory and pnpm treats it as its own workspace root, cannot find `omdsh-base` on npm, and fails before doing anything:

  ```
  ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@omdsh-plugins%2Fomdsh-base: Not Found
  ```

  This is the anticipated cost of the `linkWorkspacePackages` + semver arrangement `pnpm-workspace.yaml` explains, and it resolves itself the day `omdsh-base` is published. It is also why those two are the only plugins with no `pnpm-lock.yaml` of their own. Until then, run their commands from the workspace root (`pnpm --filter @omdsh-plugins/omdsh-codemode run test`).
- **`omdsh-remctrl` and `omdsh-remdev` carry no `harness:local` / `harness:npm` / `check:harness-pin` scripts at all**, so the root `check:harness-pin` sweep passes over them. Neither has browser specs today, which is why it has not bitten — but neither is covered by the guarantee that sweep is there to give.

## Writing a plugin

[CONVENTIONS.md](CONVENTIONS.md) is the contract: nine rules, a checklist, and a worked example. It is short because the rules are almost all "use the seam the harness already has". [README-STYLE.md](README-STYLE.md) is the documentation half — what every README here agrees to look like.

`omdsh-shortcuts` is the reference implementation. Reading its `src/bindings.ts` and the settings block at the end of its `src/index.ts` is the shortest route to writing the same thing for another plugin.

## Known limitations

- **Ten of the twelve are not on npm yet.** `omdsh-base` and `omdsh-plughub` are published and install by name; every other `@omdsh-plugins/…` name in this document answers `ERR_PNPM_FETCH_404` when `dsh plugin add` is given it. Those ten install through the hub — its command or its button, which resolve each from the registry and install it from its GitHub repository — or from a checkout, and the hub reports a checkout install as `linked` rather than up to date, because there was never anything to fetch.
- **Installs need a restart.** The loader composes a profile at boot; nothing here hot-swaps a bundle.
- **The hub's write routes are loopback-only.** A `dsh web` served to another host can browse the catalog but cannot install from it.
- **Some surfaces are borrowed, not owned.** The mode switch anchors itself to a published attribute on the conversation column, the sidebar dots are painted onto the harness's own rows, and two plugins portal into DOM anchors. Each degrades to nothing rather than to something wrong when the markup underneath changes — but each is a selector this collection has to follow.
- **`omdsh-remctrl` is at M0**: the port, the pairing, and the allowlist, with no desktop panel yet.

[schemastery]: https://github.com/shigma/schemastery
