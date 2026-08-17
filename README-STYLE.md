# README style for this collection

English | [中文](README-STYLE.zh.md)

What every README in this repository agrees to look like, so that a reader who
has read one has read them all. `omdsh-base/README.md` is the exemplar; this
file is that exemplar stated as rules.

## The skeleton

A plugin repository's `README.md` is these sections, in this order:

```markdown
# omdsh-<name>

English | [中文](README.zh.md)

<one lead paragraph: what it is, linking the harness>

## What it adds

| Surface | Where it comes from |
|---|---|
| … | … |

<narrative sections — as many as the plugin earns, sentence-case headings>

## Install

## Commands

## Known limitations
```

`README.zh.md` mirrors it heading for heading, with the same code blocks and
the same table rows in the same order.

## The rules

### 1. The title is the bare package name

`# omdsh-shortcuts`. Not `` # `@omdsh-plugins/omdsh-shortcuts` ``, not the
scope, not backticks. A title is read, not typed; the scope belongs in the
install command, where it is copied.

`registry/` is the one exception — it has no npm package name, so it keeps the
repository name it is published under: `# omdsh-plugins/registry`, unbackticked.

### 2. Line 3 is the language switcher, byte for byte

```markdown
English | [中文](README.zh.md)
```

and in the Chinese file:

```markdown
[English](README.md) | 中文
```

Not `[中文](README.zh.md)` alone, not `[简体中文]`. Both halves are always
present, and the current language is the one that is not a link.

### 3. The lead links the harness

The first paragraph says what the plugin is in one sentence and links
`[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)` on first
mention. A reader who arrived from a search engine learns what this is a plugin
*for* without leaving the paragraph.

### 4. `## What it adds` is a table

```markdown
| Surface | Where it comes from |
|---|---|
| The mode switch | An entry in `shell.overlay`, ui-layout's frame-wide floating layer |
```

Left column: what a person sees or can call. Right column: the seam it rides —
a slot id, a service, a route, an override. The table is the contract with the
harness stated as a list; prose below it explains whatever the list cannot.

In Chinese the header is `| 界面 | 从哪来 |`, in every file.

An application repository (`omdsh-desktop`, `omdsh-tui`) contributes no harness
surface, so it carries `## Layout` or `## Packages` in that position instead.
`registry/` describes a file, so its table is `| Field | What it is |`.

### 5. Headings are sentence case

`## Known limitations`, `## The routes it holds`, `## New Session belongs to the
mode it was pressed in`. Only the first word and proper nouns are capitalized —
including UI strings quoted as themselves (`New Session` is a button). Never
`## Known Limitations and Deferred Work`.

Never skip a level: no `####` directly under a `##`.

### 6. `## Install` names the package, and removes it too

```markdown
## Install

​```sh
npx @omdsh-plugins/omdsh-plughub add omdsh-shortcuts
​```

Or from a checkout, which is what an unpublished build wants:

​```sh
pnpm install && pnpm run build
dsh plugin --profile web add "$PWD"
​```

Remove it the same way:

​```sh
dsh plugin --profile web remove @omdsh-plugins/omdsh-shortcuts
​```
```

**The form that works today comes first.** For a plugin already on npm that is
its registry name, `dsh plugin --profile web add @omdsh-plugins/omdsh-base`; for
one that is not published yet it is the hub's own command, which resolves the
name through the registry and writes the pnpm build-allowlist entry a git
install needs. A first line that fails is worse than a longer one that works,
and `dsh plugin add` on an unpublished package answers `ERR_PNPM_FETCH_404`.
The checkout form follows either way, for anyone building it. `add` and
`remove` always name the package the same way, whichever form installed it.

The section also states the **off state** — what a profile does when a companion
plugin this one reaches for is not composed (CONVENTIONS rule 9), and what is
left standing after a `remove`. That sentence belongs here, where a reader
assembling a profile is looking, not thirty lines up in a narrative section.

`## Install` sits after the narrative and before `## Commands`. A reader decides
whether they want the plugin before they are told how to get it.

### 7. `## Commands` lists every script

Not `## Development`. Every `pnpm run` the repository defines appears, including
`harness:local`, `harness:npm` and `check:harness-pin` where they exist —
CONVENTIONS rule 8 makes that switch part of the contract, and a script no
README names is a script nobody runs.

```sh
pnpm install
pnpm run build        # tsdown bundles the host and browser halves
pnpm run typecheck
pnpm run test
```

### 8. `## Known limitations` is last, and it is limits only

Not `## Known limits`, not `## What it does not do`, not `## Known Limitations
and Deferred Work`. A bulleted list of what the plugin does not do *and the
reader would reasonably expect it to* — a borrowed anchor, an unpersisted log, a
platform it refuses. Roadmap items and upstream wishes are not limitations; put
those in the narrative or leave them out.

Nothing follows it. A trailing detail section — provenance (`## Where this came
from`), or a development aside like `## Two harness sources` — goes **between
`## Commands` and `## Known limitations`**, so the actionable pair stays
contiguous and the footnote lands where footnotes belong. Every README here
therefore ends in one of exactly two ways:

```
## Install → ## Commands → ## Known limitations
## Install → ## Commands → ## Where this came from → ## Known limitations
```

### 9. No `## License`

Every repository carries a `LICENSE` file and every `package.json` carries
`"license": "MIT"`, and GitHub renders both. A README section restating it adds
no information and displaces `## Known limitations` from the last position this
skeleton reserves for it.

### 10. The two languages say the same thing

Same headings, same order, same code blocks, same table rows. Shell literals
stay literal — `<path-to-this-directory>` is translated, `dsh plugin add` is
not. When one language gains a clause the other should have, port it rather
than trimming.

Chinese section names, fixed across the collection:

| English | 中文 |
|---|---|
| What it adds | 它提供什么 |
| Install | 安装 |
| Commands | 命令 |
| Known limitations | 已知限制 |
| Layout / Packages | 目录结构 / 包 |
| Where this came from | 它从哪里来 |
