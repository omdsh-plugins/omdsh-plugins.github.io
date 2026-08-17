#!/usr/bin/env node
/**
 * Write the organisation's profile page from this repository's READMEs.
 *
 * https://github.com/omdsh-plugins shows whatever is in `profile/README.md` of
 * a public repository named `.github`, above the repository list. That is the
 * only mechanism GitHub offers, and it reads a different repository than the
 * one this file lives in — so the page is either a hand-kept second copy of an
 * introduction that already exists, or it is generated from it. This generates
 * it, for the reason `registry/build.mjs` generates the catalog: a copy drifts
 * the first time somebody edits one of them.
 *
 * Both languages, because everything else in this collection comes in both and
 * a front door that does not is the one document a Chinese reader has to read
 * in English. Only `README.md` is rendered on the organisation page — GitHub
 * reads that one name and no other — so `README.zh.md` sits beside it in the
 * same repository and the two link to each other, exactly as the READMEs here
 * do.
 *
 * Two transformations, and both are forced by where the file ends up:
 *
 *   - It is cut at the Commands heading. Everything above it is written for
 *     somebody deciding whether this collection is for them; everything below
 *     is for somebody who already cloned it — build scripts, why `pnpm test`
 *     does not pass on a fresh clone, two known rough edges in the tooling.
 *     On an organisation's front door that half is noise, and it pushes the
 *     repository list far enough down that a visitor never reaches it.
 *   - Every relative link is made absolute. A profile README is rendered from
 *     the `.github` repository, and on the organisation page from no repository
 *     path at all, so `CONVENTIONS.md` resolves to a file that does not exist.
 *     Reference definitions used by the kept half are carried over too, since
 *     the one these READMEs have sits below the cut.
 *
 * The output goes into a checkout of the `.github` repository beside this one,
 * the way `registry/` is a checkout of the catalog repository:
 *
 *   git clone https://github.com/omdsh-plugins/.github.git org-profile
 *   node scripts/build-profile.mjs            # write both pages
 *   node scripts/build-profile.mjs --check    # fail if either would differ
 *
 * Writing them is not publishing them. The profile page updates when the
 * `.github` repository is pushed, which makes an edit to a README two pushes,
 * exactly like a release is.
 *
 * @module scripts/build-profile
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The collection root, one level up from this script. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Where a relative link in these READMEs resolves to, once one is read elsewhere. */
const BLOB = 'https://github.com/omdsh-plugins/omdsh-plugins.github.io/blob/main'

/** Where the generated pages themselves are readable, for the link between them. */
const PROFILE_BLOB = 'https://github.com/omdsh-plugins/.github/blob/main/profile'

/** The organisation page, which is what the English half is rendered as. */
const ORG = 'https://github.com/omdsh-plugins'

/** The published site. It opens in Chinese; `?lang=en` is the English view. */
const SITE = 'https://omdsh-plugins.github.io/'

/** The checkout of `omdsh-plugins/.github`, and the directory GitHub reads inside it. */
const CHECKOUT = 'org-profile'
const PROFILE = join(CHECKOUT, 'profile')

/**
 * The two pages, and everything that differs between them.
 *
 * The cut heading is named rather than counted so that renaming the section is
 * caught here instead of silently moving the cut: a profile page that quietly
 * grew four more sections is not something anybody would notice from this
 * repository.
 *
 * `switcher` matches the language line these READMEs open with, which is
 * rewritten rather than dropped — the destination differs, since only one of
 * the two pages is ever rendered as the organisation page itself.
 */
const LANGUAGES = [
  {
    source: 'README.md',
    target: 'README.md',
    cutAt: '## Commands',
    switcher: /^English \| \[中文\]\([^)]+\)$/mu,
    // Rendered AS the organisation page, so "English" is where the reader
    // already is, and the other half is a file in this repository.
    language: `English | [中文](${PROFILE_BLOB}/README.zh.md)`,
    notice: [
      '<!-- Generated from README.md by scripts/build-profile.mjs in',
      '     omdsh-plugins/omdsh-plugins.github.io. Edit that README, run the script,',
      '     and push both. Editing this file directly is undone by the next run. -->',
    ],
    footer: [
      `**[The full README](${BLOB}/README.md)** — the half this page leaves out: the commands, the tooling's known rough edges, and what a plugin here agrees to.`,
      `Everything on one page, with the catalog and the conventions, is on [the site](${SITE}?lang=en).`,
    ],
  },
  {
    source: 'README.zh.md',
    target: 'README.zh.md',
    cutAt: '## 命令',
    switcher: /^\[English\]\([^)]+\) \| 中文$/mu,
    // Read as a file, so "English" goes back to the organisation page rather
    // than to the blob it was generated into.
    language: `[English](${ORG}) | 中文`,
    notice: [
      '<!-- 由 omdsh-plugins/omdsh-plugins.github.io 里的 scripts/build-profile.mjs',
      '     从 README.zh.md 生成。要改就改那份 README，跑一次脚本，两个仓库都推。',
      '     直接改这个文件，下一次生成就会把它覆盖掉。 -->',
    ],
    footer: [
      `**[完整 README](${BLOB}/README.zh.md)** —— 这一页略去的那一半：命令、工具链上已知的毛病，以及一个插件在这里答应的事。`,
      `想一页看完，连目录和公约一起，去[站点](${SITE})。`,
    ],
  },
]

/**
 * One page, rendered from the README it mirrors.
 * @param {(typeof LANGUAGES)[number]} language - which page.
 * @returns {string} the file to write.
 */
function render(language) {
  const readme = readFileSync(join(ROOT, language.source), 'utf8')

  const cut = readme.indexOf(`\n${language.cutAt}\n`)
  if (cut < 0) {
    console.error(`${language.source} has no "${language.cutAt}" heading, which is where the profile page is cut.`)
    console.error('The section was renamed — update LANGUAGES in scripts/build-profile.mjs to the new one.')
    process.exit(1)
  }

  if (!language.switcher.test(readme)) {
    console.error(`${language.source} does not open with the language line this script rewrites:`)
    console.error(`  ${String(language.switcher)}`)
    console.error('Update LANGUAGES in scripts/build-profile.mjs, or the two pages will not link to each other.')
    process.exit(1)
  }

  /**
   * Every reference-style link definition in the README, by label.
   *
   * `[schemastery]` is used in the Configure section and defined on the last
   * line of the file, which the cut removes. Carrying the definitions across
   * keeps a link that reads fine here from rendering as literal brackets there.
   * @type {Array<[string, string]>}
   */
  const definitions = [...readme.matchAll(/^\[([^\]]+)\]: (.+)$/gmu)].map(([, label, target]) => [label, target])

  const kept = readme.slice(0, cut).replace(language.switcher, language.language)

  // Rewrites `](FILE.md)` and `](FILE.md#anchor)`. Anything already absolute
  // has a scheme in front of it and does not match.
  const linked = kept.replaceAll(/\]\(([A-Za-z][\w.-]*\.md)(#[^)]*)?\)/gu, (_, file, anchor) => `](${BLOB}/${file}${anchor ?? ''})`)

  /** The definitions the kept half still refers to, in the order they are defined. */
  const carried = definitions.filter(([label]) => new RegExp(String.raw`\]\[${label}\]|\[${label}\](?!:|\()`, 'u').test(linked))

  return [
    ...language.notice,
    '',
    linked.trimEnd(),
    '',
    ...carried.map(([label, target]) => `[${label}]: ${target}`),
    ...carried.length > 0 ? [''] : [],
    '---',
    '',
    ...language.footer,
    '',
  ].join('\n')
}

/**
 * What is in the profile repository now, or undefined when there is no checkout.
 * @param {string} path - the file, absolute.
 * @returns {string | undefined} its contents, or undefined.
 */
function held(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return undefined
  }
}

const pages = LANGUAGES.map(language => {
  const path = join(ROOT, PROFILE, language.target)
  return { language, path, rendered: render(language), current: held(path) }
})

if (process.argv.includes('--check')) {
  if (pages.every(page => page.current === undefined)) {
    console.error(`no ${PROFILE}/ beside ${ROOT} — clone the profile repository first:\n`)
    console.error(`  git clone https://github.com/omdsh-plugins/.github.git ${CHECKOUT}\n`)
    console.error('it is a repository of its own, which is why this checkout ignores it.')
    process.exit(1)
  }
  const stale = pages.filter(page => page.current !== page.rendered)
  if (stale.length > 0) {
    for (const page of stale) {
      console.error(`${join(PROFILE, page.language.target)} is ${page.current === undefined ? 'missing' : 'stale'} — it is generated from ${page.language.source}`)
    }
    console.error(`\nrun \`node scripts/build-profile.mjs\` and push the ${CHECKOUT} checkout.`)
    process.exit(1)
  }
  console.log(`${PROFILE}/ is current (${pages.map(page => page.language.target).join(', ')})`)
} else {
  mkdirSync(join(ROOT, PROFILE), { recursive: true })
  for (const page of pages) {
    writeFileSync(page.path, page.rendered)
    console.log(page.current === page.rendered
      ? `${join(PROFILE, page.language.target)} was already current`
      : `wrote ${join(PROFILE, page.language.target)} from ${page.language.source}`)
  }
  // The write is half of it, and the half that shows up on the page is the
  // other one — so say so rather than reporting success and stopping.
  console.log(`commit and push ${CHECKOUT}/ for ${ORG} to change.`)
}
