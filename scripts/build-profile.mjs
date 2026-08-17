#!/usr/bin/env node
/**
 * Write the organisation's profile README from this repository's own.
 *
 * https://github.com/omdsh-plugins shows whatever is in `profile/README.md` of
 * a public repository named `.github`, above the repository list. That is the
 * only mechanism GitHub offers, and it reads a different repository than the
 * one this file lives in — so the page is either a hand-kept second copy of an
 * introduction that already exists, or it is generated from it. This generates
 * it, for the reason `registry/build.mjs` generates the catalog: a copy drifts
 * the first time somebody edits one of them.
 *
 * Two transformations, and both are forced by where the file ends up:
 *
 *   - It is cut at `## Commands`. Everything above that heading is written for
 *     somebody deciding whether this collection is for them; everything below
 *     is for somebody who already cloned it — build scripts, why `pnpm test`
 *     does not pass on a fresh clone, two known rough edges in the tooling.
 *     On an organisation's front door that half is noise, and it pushes the
 *     repository list far enough down that a visitor never reaches it.
 *   - Every relative link is made absolute. A profile README is rendered from
 *     the `.github` repository, so `CONVENTIONS.md` there resolves to a file
 *     that does not exist. Reference definitions used by the kept half are
 *     carried over too, since the one this README has sits below the cut.
 *
 * The output goes into a checkout of the `.github` repository beside this one,
 * the way `registry/` is a checkout of the catalog repository:
 *
 *   git clone https://github.com/omdsh-plugins/.github.git org-profile
 *   node scripts/build-profile.mjs            # write org-profile/profile/README.md
 *   node scripts/build-profile.mjs --check    # fail if it would differ (for CI)
 *
 * Writing it is not publishing it. The profile page updates when the `.github`
 * repository is pushed, which makes an edit to README.md two pushes, exactly
 * like a release is.
 *
 * @module scripts/build-profile
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The collection root, one level up from this script. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Where a relative link in this README resolves to, once it is read elsewhere. */
const BLOB = 'https://github.com/omdsh-plugins/omdsh-plugins.github.io/blob/main'

/** The published site, linked from the footer this adds. */
const SITE = 'https://omdsh-plugins.github.io/'

/** The checkout of `omdsh-plugins/.github`, and the path GitHub reads inside it. */
const CHECKOUT = 'org-profile'
const PROFILE = join(CHECKOUT, 'profile', 'README.md')

/**
 * The heading that starts the contributor half.
 *
 * Named rather than counted so that renaming the section is caught here instead
 * of silently moving the cut: a profile page that quietly grew four more
 * sections is not something anybody would notice from this repository.
 */
const CUT_AT = '## Commands'

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8')

const cut = readme.indexOf(`\n${CUT_AT}\n`)
if (cut < 0) {
  console.error(`README.md has no "${CUT_AT}" heading, which is where the profile page is cut.`)
  console.error('The section was renamed — update CUT_AT in scripts/build-profile.mjs to the new one.')
  process.exit(1)
}

/**
 * Every reference-style link definition in the README, by label.
 *
 * `[schemastery]` is used in the Configure section and defined on the last line
 * of the file, which the cut removes. Carrying the definitions across keeps a
 * link that reads fine here from rendering as literal brackets there.
 * @type {Map<string, string>}
 */
const definitions = new Map(
  [...readme.matchAll(/^\[([^\]]+)\]: (.+)$/gmu)].map(([, label, target]) => [label, target]),
)

/** The visitor-facing half, with the language switcher dropped — the footer carries it. */
const kept = readme
  .slice(0, cut)
  .replace(/^English \| \[中文\]\([^)]+\)\n\n/mu, '')

/**
 * Absolute links only.
 *
 * Rewrites `](FILE.md)` and `](FILE.md#anchor)`. Anything already absolute has
 * a scheme in front of it and does not match.
 */
const linked = kept.replaceAll(/\]\(([A-Za-z][\w.-]*\.md)(#[^)]*)?\)/gu, (_, file, anchor) => `](${BLOB}/${file}${anchor ?? ''})`)

/** The definitions the kept half still refers to, in the order they are used. */
const carried = [...definitions].filter(([label]) => new RegExp(String.raw`\]\[${label}\]|\[${label}\](?!:|\()`, 'u').test(linked))

const rendered = [
  '<!-- Generated from README.md by scripts/build-profile.mjs in',
  '     omdsh-plugins/omdsh-plugins.github.io. Edit that README, run the script,',
  '     and push both. Editing this file directly is undone by the next run. -->',
  '',
  linked.trimEnd(),
  '',
  ...carried.map(([label, target]) => `[${label}]: ${target}`),
  ...carried.length > 0 ? [''] : [],
  '---',
  '',
  `**[The full README](${BLOB}/README.md)** — the half this page leaves out: the commands, the tooling's known rough edges, and what a plugin here agrees to.`,
  `Also [in Chinese](${BLOB}/README.zh.md), and on [the site](${SITE}).`,
  '',
].join('\n')

const target = join(ROOT, PROFILE)

/**
 * What is in the profile repository now, or undefined when there is no checkout.
 * @returns {string | undefined} the file, or undefined.
 */
function held() {
  try {
    return readFileSync(target, 'utf8')
  } catch {
    return undefined
  }
}

const current = held()

if (process.argv.includes('--check')) {
  if (current === undefined) {
    console.error(`no ${PROFILE} beside ${ROOT} — clone the profile repository first:\n`)
    console.error(`  git clone https://github.com/omdsh-plugins/.github.git ${CHECKOUT}\n`)
    console.error('it is a repository of its own, which is why this checkout ignores it.')
    process.exit(1)
  }
  if (current !== rendered) {
    console.error(`${PROFILE} is stale — run \`node scripts/build-profile.mjs\` and push the ${CHECKOUT} checkout.`)
    process.exit(1)
  }
  console.log(`${PROFILE} is current (${String(rendered.split('\n').length)} lines)`)
} else {
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, rendered)
  // The write is half of it, and the half that shows up on the page is the
  // other one — so say so rather than reporting success and stopping.
  console.log(current === rendered ? `${PROFILE} was already current` : `wrote ${PROFILE}`)
  console.log(`commit and push ${CHECKOUT}/ for https://github.com/omdsh-plugins to change.`)
}
