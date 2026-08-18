# omdsh plugin conventions

English | [中文](CONVENTIONS.zh.md)

What a plugin in this directory agrees to, so that
[`omdsh-plughub`](omdsh-plughub/) can list it, install it, and configure it
without knowing anything about it in particular.

The rules are short because they are almost all "use the seam the harness
already has". A plugin hub that needed each plugin to teach it something would
need editing before every new plugin could appear; this one needs nothing,
because everything it renders is read from what the plugin already declares.

## The nine rules

### 1. Configuration is a settings namespace

A plugin with anything to configure registers ONE settings namespace, named for
its unscoped package name, with a [schemastery] schema:

```ts
export const SETTINGS_NAMESPACE = 'omdsh-shortcuts'

export const Config: Schema<ShortcutConfig, Required<ShortcutConfig>> = Schema.object({ /* … */ })

ctx.inject?.(['settings'], (sctx) => {
  const settings = sctx.get?.('settings') as SettingsLike | undefined
  if (settings === undefined) return
  const scope = settings.register(SETTINGS_NAMESPACE, Config, {
    base: config,          // the composition entry stays the layer underneath
    applies: 'live',       // or 'restart', see rule 4
    validate: value => { /* cross-field checks the schema cannot express */ },
  })
  adopt(scope.get())
  sctx.effect(() => scope.watch(next => { adopt(next) }))
})
```

The namespace must match `^[a-z][a-z0-9-]*$` — the settings service refuses
anything else.

Three details are load-bearing:

- **`base: config`.** The cordis patch entry becomes the layer under the user's
  edits, so a profile that configures a plugin keeps configuring it and the
  panel shows which fields a person has actually changed.
- **`ctx.inject(['settings'], …)`.** The registration rides a scoped fiber, so
  a composition with no settings provider — headless, a test bench — runs on
  the entry config exactly as before. Configurability is additive, never
  required.
- **Resolve the service by NAME.** A package compiled outside the harness
  typechecks its browser and host halves as one program, so `ctx.settings` is
  whichever `Context` declaration the compiler saw first. Use `ctx.get('settings')`
  and a structural type.

Nothing else is needed. `omdsh-plughub`'s host half reads the namespace with
`ctx.settings.describe({ redactSecrets: true })`, carries it to its panel,
renders a form from the schema, and writes back with `ctx.settings.mutate`.
Validation, persistence, the base/user layering, secret redaction, revision
conflicts, and hot commits are all the harness's, already written.

(The hub carries it over a route of its own rather than the harness's
`settings.describe` RPC, because that RPC is gated by a hard-coded allowlist of
namespace names that no out-of-tree plugin can be in. That is the hub's
problem, not yours — nothing in the code above changes either way.)

### 2. The schema carries its own words

Label every field with `.description()`, and localize the schema with
`.i18n({ zh: { … } })`:

```ts
Schema.object({
  bindings: Schema.dict(Schema.string())
    .description('Keyboard shortcut per command id, as an Electron accelerator.'),
}).i18n({
  zh: { bindings: '每个命令 id 对应的快捷键，写作 Electron accelerator。' },
})
```

`.i18n()` serializes a description as a locale map with `''` for the default,
and the hub resolves it against the active locale. **No plugin registers a
dictionary with the hub**, and no dictionary in the hub grows an entry per
plugin — which is the property that lets a plugin written next year get correct
labels in both languages on the day it is installed.

Write descriptions as SENTENCES. The hub titles each control from its property
name (`maxRepos` → `Max repos`) and puts the description underneath, the way
the harness's own settings rows read.

Use `.comment()` for a note under the control, `.link()` for a documentation
link beside it, `.hidden()` for a field a form should not offer, and
`.min()`/`.max()`/`.step()` on numbers.

### 3. Secrets are declared, not hoped for

A field holding a credential gets `.role('secret')`. The wire strips it from
every response and reports only whether a value is stored, and the hub renders
a write-only control. A secret that is not declared travels in plaintext to
every browser that opens the panel.

### 4. Say when a change takes effect

`applies: 'live'` (the default) means a change is acted on as it commits;
`applies: 'restart'` means it is not. The hub marks a restart-only plugin on
its card, so a person is not left wondering why nothing happened.

Prefer `live`. It usually costs one `watch` callback that recomputes whatever
the config derived — `omdsh-shortcuts` rebuilds its menu document and pushes it
down the streams that are already open — and it is the difference between a
setting and a thing you have to restart for.

### 5. Declare display metadata in `package.json`

```jsonc
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "plughub": {
    "displayName": { "": "Shortcuts", "zh": "快捷键" },
    "summary":     { "": "One chord per command.", "zh": "为每个命令绑定一个快捷键。" },
    "category": "input",
    "settings": ["omdsh-shortcuts"],
    "docs": "https://github.com/omdsh-plugins/omdsh-shortcuts#readme",
    "order": 10
  }
}
```

Every field is optional. A plugin that declares nothing still appears, under
its package name, and `settings` falls back to the unscoped package name — so
following rule 1 alone is enough to be configurable.

**Every plugin here declares a `displayName`, and they are all written the same
way.** Title Case, every word capitalized: `Remote Control`, `Side Panels`,
`Usage`. Spelled out rather than abbreviated — a package name is typed, so it
contracts (`omdsh-remctrl`); a title is read, so it does not (`Remote
Control`). Say what the plugin IS rather than repeating what it is filed under:
`Chat Mode`, not `Chatmode`. Translate it the way the summary beside it is
translated. The hub no longer folds the case, so what the manifest says is what
the panel shows.

The fallback is still there, for plugins from outside this repo and for the
harness's own bundles: nothing declared, so the card is titled with the package
name as npm spells it (`dsh-web-app`). That is the honest rendering — nobody
wrote those a title, and an identifier should look like one.

Declare `settings` explicitly when a plugin owns a namespace that is not its
own name, or owns more than one.

`dsh.bundle.patch` is what makes a package installable at all: `dsh plugin`
adds a dependency to the profile's layer stack exactly when its manifest
declares one.

### 6. A control the form cannot draw gets a card

The generic form draws strings, numbers, booleans, closed unions, string lists,
string dictionaries, and nested objects. It refuses anything else rather than
guessing — a guessed control writes the wrong shape and passes validation while
meaning something else.

When a plugin needs a control the form cannot draw (capturing a keystroke
rather than typing `Ctrl+K` into a box), its browser half registers a card in
the hub's slot, under its **package name** as the id:

```ts
ctx.slots.inject('omdsh.plugin.card', () => ctx.slots.register({
  name: 'omdsh.plugin.card',
  id: '@omdsh-plugins/omdsh-shortcuts',
  inject: () => ({ /* your own face */ }),
}, ChordCaptureCard))
```

The card renders instead of the generic form for that plugin. The plugin still
owns its settings namespace and still writes through `settings.mutate` — the
escape hatch changes what the control looks like, never where the value lives.

### 7. Keep `version` semver, and bump it on release

The hub's Update button is lit by one comparison: the version the catalog
source advertises against the version of the package on disk, ordered by
semver. So a plugin's `version` field is not bookkeeping — it is the ONLY
signal anybody gets that a new release exists.

Three things follow.

**Bump it when you publish.** Pushing new code at the same version means every
installed copy reports "up to date" and nobody is offered the change.

**Keep it parseable.** `2024.03`, `latest`, and `1.2` are not semver, so the
comparison has no answer and the hub reports `unknown` rather than guessing a
direction. A prerelease is fine and ordered correctly: `1.0.0-rc.2` is behind
`1.0.0-rc.10`, and both are behind `1.0.0`.

**Do not expect it to matter for a checkout install.** `dsh plugin add <path>`
records a `link:` dependency, so the installed files ARE the checkout and the
two versions are the same file. The hub reports that as `linked` instead of "up
to date", because there was never anything to fetch.

**Move the catalog row with it.** The hub's default catalog is the curated
manifest in [`omdsh-plugins/registry`][registry] — so the version an
installation compares against is the one THAT file advertises, not the one on
your default branch. The manifest is generated from these `package.json` files,
so a release is two pushes: the plugin, then `node registry/build.mjs` and the
registry.

[registry]: https://github.com/omdsh-plugins/registry

### 8. Three things a plugin here never does

- **Edit `deepseek-harness`.** It is a tracked fork kept clean so it can follow
  upstream; a local patch there is lost or conflicts on the next sync. Every
  feature ships as an out-of-tree bundle. If a seam is missing, take it from a
  plugin in this directory instead.
- **Commit a `link:` specifier.** pnpm resolves it against the declaring
  manifest, so it hard-codes one machine's layout — and it fails SILENTLY:
  dangling symlink, "successful" install, then `tsc` TS2307 on every harness
  import. Commit the registry pin and switch with a `harness:local <path>` /
  `harness:npm` script, plus a `check:harness-pin` that fails while anything is
  linked.
- **Import another plugin's values in the browser half.** The client bundle
  purity gate forbids it: a cross-plugin value import either inlines a second
  copy of that plugin's runtime or asks the frozen module table for a specifier
  it cannot answer. Collaborate through cordis services and slots; type-only
  imports are erased and are fine. Rule 9 is how you depend on one.

### 9. Another plugin's service never goes in your `inject`

The harness's own services — `slots`, `sessions`, `workspaces`,
`workspaceRegistry`, `locale`, `connection`, `webServer`, `webRuntime`,
`settings`, `sessionProjections`, `invariants` — are composed by `dsh-base` and
the surface bundle, so a top-level `inject` naming them always resolves. (The
test is where a name is composed, not whether it appears in this list:
`webRuntime` comes from the web-app surface bundle, so a plugin that names it
is declaring it needs that surface — which is the honest thing for a plugin
that has a browser half.) A service published by another plugin in this directory
(`sessionModes` from omdsh-chatmode, `shortcut` from omdsh-shortcuts, `remdev`
from omdsh-remdev) is a different kind of fact: whether it exists is a property
of the PROFILE, and a profile is assembled by a person one `dsh plugin add` at
a time.

cordis's inject wait has no timeout, so an entry naming a service nobody
composed sits at `pending` forever — and both boot audits fail the whole app
for any entry that is not active (the host's `assertEntriesActivated`, and the
browser's post-settle sweep in `dsh-client-web`):

```
web boot: 1 entry did not activate
@omdsh-plugins/omdsh-codemode: pending (waiting for service: sessionModes)
```

That is a dead UI, not a disabled feature — one missing companion plugin takes
the whole page down, including every plugin that had nothing to do with it. So
**reach for another plugin's service from inside `apply`, never from
`inject`.** Two shapes, both already in the tree:

- **A restricted fiber**, when the dependency has a lifetime — mount while it
  is there, unmount when it goes:

  ```ts
  export const inject = ['slots', 'sessions', 'locale']   // harness services only

  export function apply(ctx: ClientContext): void {
    ctx.inject([SESSION_MODES], (mctx) => {
      const modes = mctx.get(SESSION_MODES) as SessionModes | undefined
      // Reachable when the name is provided by a fiber that is not active.
      if (modes === undefined) return
      mountMode(mctx, modes)
    })
  }
  ```

  A fiber started inside `apply` is not a loader entry, so waiting forever
  costs nothing. Hang the effects on `mctx` rather than `ctx`, and a provider
  that unloads at runtime withdraws your registrations with it.

- **A lazy read**, when you only need the service at the moment something is
  called: `ctx.get('remdev') as RemdevFace | undefined`, and answer for
  yourself when it is `undefined`.

This is rule 1's `ctx.inject(['settings'], …)` generalized, and it holds for
the same reason: depending on another plugin is additive, never a
precondition. Say in your README what the off state is — and make sure it is
inert, not fatal.

## Checklist for a new plugin

- [ ] `package.json` declares `dsh.bundle.patch`, and `dsh.client` if it has a
      browser half
- [ ] `package.json` declares `dsh.plughub` display metadata
- [ ] The host half exports a schemastery `Config` with a localized description
      per field
- [ ] It registers its settings namespace through `ctx.inject(['settings'], …)`
      with `base` set to the composition entry
- [ ] Credentials carry `.role('secret')`
- [ ] `applies` is honest
- [ ] No service another plugin publishes appears in a top-level `inject`; the
      profile without it boots, and the README says what the off state is
- [ ] `version` is semver and gets bumped on release
- [ ] Harness dependencies are the committed registry pin, not `link:`
- [ ] Harness `peerDependencies` name a RANGE, never `*`. Every
      `@deepseek-ai/dsh-*` version on npm is a prerelease, so the `latest`
      dist-tag still points at the first one ever published — and `*` defers to
      `latest`. Nothing in the workspace notices: the harness resolves through
      the pinned devDependencies there, so install, build, tests and
      `check:harness-pin` all pass while the published package cannot be
      installed at all
- [ ] `pnpm install && pnpm run build && pnpm run typecheck` from a bare clone
- [ ] `pnpm test` passes its node-only specs from a bare clone, and its whole
      suite after `pnpm run harness:local <path> && pnpm install`. A published
      harness package ships no sources, so a browser spec cannot run against
      the pin — alias those specifiers to a guard that throws with that
      instruction rather than failing the vitest config, which would take the
      node-only specs down with it. Switch back with `harness:npm` before
      committing; `check:harness-pin` is what catches you if you forget

## Worked example

`omdsh-shortcuts` is the reference implementation. Its configuration splits
along the line rule 1 draws:

- `items` — which commands exist, what they read as, who performs them. A
  composition fact, `.hidden()` from the form, edited in a profile's patch file.
- `bindings` — which key reaches which command. A person's fact, a flat
  `dict(string)`, edited in the hub.

Reading `src/bindings.ts` and the settings block at the end of `src/index.ts`
is the shortest route to writing the same thing for another plugin.

[schemastery]: https://github.com/shigma/schemastery
