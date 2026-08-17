#!/usr/bin/env node
/**
 * Fail when the published site and the READMEs stop agreeing with the packages.
 *
 * This repository publishes the same collection three times over. `docs/` is
 * served at https://omdsh-plugins.github.io/ as hand-written HTML; `README.md`
 * and `README.zh.md` are what GitHub renders on the repository page, and are
 * never read by the site build — there is no site build. Nothing links the
 * three, so a plugin added to one of them stays absent from the others until
 * somebody notices, which is exactly how a catalog card sat at `0.1.1` while
 * the registry had moved to `0.1.2`.
 *
 * So this script is the link. It does not generate anything: the site is
 * written, not derived, because the front page argues a case the READMEs do not
 * and a generator would flatten both. It only refuses to let the two disagree
 * about a fact that is written down somewhere else:
 *
 *   - the packages, their versions, categories and settings namespaces, which
 *     `registry/registry.json` already derives from the plugins themselves;
 *   - the toolchain — the harness release, Node, pnpm — from the root manifest;
 *   - the nine rules, from `CONVENTIONS.md` and its translation;
 *   - and the counts, which are the part nobody remembers: adding one plugin
 *     moves a number in fourteen places across three files.
 *
 * Anything that is genuinely prose is left alone. The site says things about a
 * plugin that its manifest never will, and this check has no opinion on those.
 *
 * `registry.json` is this script's source of truth for the packages, and
 * `node registry/build.mjs --check` is what keeps that file honest against the
 * checkouts. They answer different questions and want different things present,
 * so run both locally, registry first: a stale registry is then reported as a
 * stale registry rather than as twelve wrong cards.
 *
 * Only this one runs in CI. The generator reads the plugin checkouts, and this
 * repository tracks none of them — every one is its own repository, ignored
 * here — so on a runner there is nothing for it to read. This script needs only
 * the manifest those checkouts produce, which the workflow clones beside this
 * one, and comparing the site against the *published* catalog is the more
 * useful question anyway: it is the one a visitor gets an answer to.
 *
 *   node scripts/check-docs.mjs        # or: pnpm run check:docs
 *
 * @module scripts/check-docs
 */

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The collection root, one level up from this script. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The GitHub account every documented repository belongs to. */
const UPSTREAM = 'omdsh-plugins'

/**
 * The documents this script compares, read once.
 * @param {string} relative - path from the collection root.
 * @returns {string} the file's text.
 */
function read(relative) {
  return readFileSync(join(ROOT, relative), 'utf8')
}

const SITE = 'docs/index.html'
const RULES_PAGE = 'docs/conventions/index.html'
const READMES = /** @type {const} */ (['README.md', 'README.zh.md'])

/** The conventions, per language, with the file each was read from. */
const CONVENTIONS = { en: 'CONVENTIONS.md', zh: 'CONVENTIONS.zh.md' }

/** The documentation style, likewise. It is a contract this script reads, not only prose. */
const STYLE = { en: 'README-STYLE.md', zh: 'README-STYLE.zh.md' }

/**
 * Every document this script reads, keyed by the path a message would name.
 *
 * One map rather than a variable each, because a failure is reported as
 * `path:line` and both halves have to come from the same place.
 */
const documents = Object.fromEntries(
  [SITE, RULES_PAGE, ...READMES, CONVENTIONS.en, CONVENTIONS.zh, STYLE.en, STYLE.zh]
    .map(path => [path, read(path)]),
)

const site = documents[SITE]
const rulesPage = documents[RULES_PAGE]
const readme = { 'README.md': documents['README.md'], 'README.zh.md': documents['README.zh.md'] }
const conventions = { en: documents[CONVENTIONS.en], zh: documents[CONVENTIONS.zh] }
const manifest = JSON.parse(read('package.json'))

/**
 * The published catalog, from the checkout beside this one.
 *
 * `registry/` is ignored here because it is its own repository, so it is the
 * one input that can genuinely be absent — on a fresh clone, and on a runner
 * that forgot to fetch it. Saying so beats reporting that the site documents
 * twelve plugins the registry has never heard of.
 */
const registry = (() => {
  try {
    return JSON.parse(read('registry/registry.json'))
  } catch {
    console.error(`no registry/registry.json beside ${ROOT} — clone it first:\n`)
    console.error(`  git clone https://github.com/${UPSTREAM}/registry.git registry\n`)
    console.error('it is a repository of its own, which is why this checkout ignores it.')
    process.exit(1)
  }
})()

/** Everything that disagreed, reported together rather than one run at a time. */
const problems = []

/**
 * Record one disagreement.
 * @param {string} file - where the wrong text is, so the message names a place to
 *   edit — `file:line` where the offset is known, which is also what a terminal
 *   turns into a link.
 * @param {string} message - what disagrees with what.
 */
function fail(file, message) {
  problems.push(`${file}: ${message}`)
}

/* ────────────────────────────── the packages ─────────────────────────────── */

/** Every plugin row, in the order the registry lists them. */
const plugins = registry.plugins.map(row => ({
  name: row.name,
  /** The repository name alone — what a README links to and a card points at. */
  repo: row.repo.slice(`${UPSTREAM}/`.length),
  version: row.version,
  category: row.plughub?.category ?? '',
  settings: [...row.plughub?.settings ?? []].sort(),
}))

/** Package name → its row, for looking one up from a card or a table. */
const byName = new Map(plugins.map(plugin => [plugin.name, plugin]))

/** Category → how many plugins are in it. */
const perCategory = new Map()
for (const plugin of plugins) perCategory.set(plugin.category, (perCategory.get(plugin.category) ?? 0) + 1)

/* ─────────────────────────────── small tools ─────────────────────────────── */

/**
 * The five entities the site is written with, decoded.
 * @param {string} html - markup or an attribute value.
 * @returns {string} the text it renders as.
 */
function decode(html) {
  return html
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
}

/**
 * Plain text from a fragment of the page: tags dropped, entities decoded,
 * whitespace collapsed.
 *
 * Used where the site and a Markdown document say the same sentence in
 * different markup — a rule title is `` `package.json` `` in one and
 * `<code>package.json</code>` in the other, and neither difference is drift.
 * @param {string} html - the fragment.
 * @returns {string} its text.
 */
function text(html) {
  return decode(html.replaceAll(/<[^>]+>/gu, '')).replaceAll('`', '').replaceAll(/\s+/gu, ' ').trim()
}

/**
 * The Chinese and English halves of a bilingual element.
 *
 * Every translated string on the site is one `<span class="zh">` beside one
 * `<span class="en">`, which the page's stylesheet shows one of.
 * @param {string} html - the element's inner markup.
 * @returns {{ zh: string, en: string } | undefined} both halves, or undefined
 *   when the element is not a bilingual pair.
 */
function bilingual(html) {
  const match = /<span class="zh">(.*?)<\/span>\s*<span class="en">(.*?)<\/span>/su.exec(html)
  return match === null ? undefined : { zh: text(match[1]), en: text(match[2]) }
}

/**
 * The part of the page under one section id, up to the next section.
 * @param {string} id - the section's id attribute.
 * @returns {string} that section's markup.
 */
function section(id) {
  const start = site.indexOf(`<section id="${id}">`)
  if (start < 0) {
    fail(SITE, `no <section id="${id}"> — this script reads the page by section, so it cannot check that part`)
    return ''
  }
  const end = site.indexOf('<section id=', start + 1)
  return site.slice(start, end < 0 ? undefined : end)
}

/**
 * Report two sets against each other, naming which one is the authority.
 * @param {string} file - where the second set is written, and where the fix goes.
 * @param {string} what - what the sets hold, for the message.
 * @param {string} authority - the document that decides, for the message.
 * @param {Iterable<string>} expected - what the authority has.
 * @param {Iterable<string>} found - what this file has.
 */
function sameSet(file, what, authority, expected, found) {
  const want = new Set(expected)
  const have = new Set(found)
  const missing = [...want].filter(entry => !have.has(entry))
  const extra = [...have].filter(entry => !want.has(entry))
  if (missing.length > 0) fail(file, `${what} in ${authority} and not here: ${missing.join(', ')}`)
  if (extra.length > 0) fail(file, `${what} here and not in ${authority}: ${extra.join(', ')}`)
}

/**
 * The line a match landed on, so a message points at somewhere to edit.
 * @param {string} document - the file's text.
 * @param {number} index - the offset the match started at.
 * @returns {number} the 1-based line number.
 */
function lineAt(document, index) {
  let line = 1
  for (let cursor = document.indexOf('\n'); cursor >= 0 && cursor < index; cursor = document.indexOf('\n', cursor + 1)) line += 1
  return line
}

/* ───────────────────────────── the catalog cards ─────────────────────────── */

/**
 * One card per plugin, parsed from the catalog grid.
 *
 * The card carries four facts the registry also carries — the package name, the
 * version, the category (twice: as the filter's `data-cat` and as the label
 * printed on the card), and the settings namespaces it advertises as chips.
 * @returns {Array<{ name: string, line: number, version: string, category: string, label: string, tone: string, settings: string[] }>} the cards.
 */
function cards() {
  return [...site.matchAll(/<article class="card"[\s\S]*?<\/article>/gu)].map(match => {
    const card = match[0]
    const name = /<p class="pkg">([^<]+)<\/p>/u.exec(card)?.[1] ?? ''
    const top = /<div class="card-top">.*?<\/span>([^<]*)<span class="ver">([^<]*)<\/span>/u.exec(card)
    return {
      name: name.trim(),
      line: lineAt(site, match.index),
      version: top?.[2].trim() ?? '',
      label: top?.[1].trim() ?? '',
      category: /<article class="card" data-cat="([^"]*)"/u.exec(card)?.[1] ?? '',
      tone: /style="--t: var\(--tone-([a-z]+)\)"/u.exec(card)?.[1] ?? '',
      settings: [...card.matchAll(/<span class="chip">settings: ([^<]+)<\/span>/gu)].map(chip => chip[1].trim()).sort(),
    }
  })
}

const catalog = cards()
sameSet(SITE, 'catalog cards', 'the registry', byName.keys(), catalog.map(card => card.name))

for (const card of catalog) {
  const plugin = byName.get(card.name)
  if (plugin === undefined) continue
  const where = `${SITE}:${String(card.line)}`
  const it = `the ${card.name} card`
  if (card.version !== plugin.version) {
    fail(where, `${it} says ${card.version}, the registry says ${plugin.version}`)
  }
  if (card.category !== plugin.category) {
    fail(where, `${it} is data-cat="${card.category}", the registry says ${plugin.category}`)
  }
  // The label and the tone are the category said twice more — once for the eye,
  // once for the colour — and a card edited by copying its neighbour gets one
  // of the three wrong without looking wrong.
  if (card.label !== plugin.category) fail(where, `${it} is labelled ${card.label}, the registry says ${plugin.category}`)
  if (card.tone !== plugin.category) fail(where, `${it} is toned --tone-${card.tone}, the registry says ${plugin.category}`)
  if (card.settings.join(' ') !== plugin.settings.join(' ')) {
    const chips = card.settings.length === 0 ? 'no settings chip' : `settings: ${card.settings.join(', ')}`
    const declared = plugin.settings.length === 0 ? 'no namespace' : plugin.settings.join(', ')
    fail(where, `${it} shows ${chips}, the plugin registers ${declared}`)
  }
}

/* ───────────────────────────── the category filter ───────────────────────── */

const filters = [...section('catalog').matchAll(/<button type="button" data-cat="([^"]*)"[\s\S]*?<span class="n">(\d+)<\/span>/gu)]
sameSet(SITE, 'catalog filter buttons', 'the registry', ['all', ...perCategory.keys()], filters.map(([, category]) => category))

for (const [, category, count] of filters) {
  const expected = category === 'all' ? plugins.length : perCategory.get(category)
  if (expected !== undefined && Number(count) !== expected) {
    fail(SITE, `the ${category} filter counts ${count}, the registry has ${String(expected)}`)
  }
}

/* ─────────────────────────── the README tables ───────────────────────────── */

/**
 * Every repository a README links to from inside a table, with the heading it
 * sits under, in document order.
 *
 * Restricted to table rows on purpose: the prose links to several of these
 * repositories too, and a mention is not a listing. The heading comes along
 * because it is what says whether a row is a plugin — classifying by "is it in
 * the registry" instead would silently reclassify a plugin as an application on
 * the very run where it went missing from the registry, and report the cascade
 * rather than the cause.
 * @param {string} document - the README.
 * @returns {Array<{ heading: string, label: string, repo: string }>} the rows.
 */
function tableRows(document) {
  const rows = []
  let heading = ''
  let fenced = false
  for (const line of document.split('\n')) {
    // A shell comment at the start of a line in a fenced block looks exactly
    // like a heading, and these READMEs are half install instructions.
    if (line.startsWith('```')) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    if (line.startsWith('#')) {
      heading = line.replace(/^#+\s*/u, '').trim()
      continue
    }
    if (!line.startsWith('| [')) continue
    const link = new RegExp(String.raw`^\| \[([^\]]+)\]\(https://github\.com/${UPSTREAM}/([^)]+)\)`, 'u').exec(line)
    if (link !== null) rows.push({ heading, label: link[1], repo: link[2] })
  }
  return rows
}

/** The catalog's own repository, the one table row that is neither plugin nor application. */
const CATALOG_REPO = 'registry'

/** Which heading each README files its two non-plugin tables under, in its own language. */
const NOT_PLUGINS = {
  'README.md': { applications: 'Applications', catalog: 'Catalog' },
  'README.zh.md': { applications: '应用', catalog: '目录清单' },
}

/** The applications, as each README lists them — checked against each other and the site. */
const applications = {}

for (const file of READMES) {
  const rows = tableRows(readme[file])
  const headings = NOT_PLUGINS[file]
  const listed = rows.filter(row => row.heading !== headings.applications && row.heading !== headings.catalog)
  sameSet(file, 'plugin table rows', 'the registry', plugins.map(plugin => plugin.repo), listed.map(row => row.repo))
  for (const row of listed) {
    // The link text is the package name everywhere in these tables, and a row
    // whose text and href disagree sends the reader to the wrong repository.
    if (row.label !== row.repo) fail(file, `the ${row.label} row links to ${row.repo}`)
  }

  applications[file] = rows.filter(row => row.heading === headings.applications).map(row => row.repo)
  if (applications[file].length === 0) {
    fail(file, `no table under a "${headings.applications}" heading — the section was renamed, so update NOT_PLUGINS in scripts/check-docs.mjs`)
  }
  const catalogued = rows.filter(row => row.heading === headings.catalog).map(row => row.repo)
  if (catalogued.join(' ') !== CATALOG_REPO) {
    fail(file, `its "${headings.catalog}" table lists ${catalogued.join(', ') || 'nothing'}, and the catalog is ${CATALOG_REPO}`)
  }
}

// The two READMEs are one document in two languages: same tables, same rows, in
// the same order. Anything else means one of them was updated and the other was
// not, which is the failure this whole script exists to name.
const ordered = Object.fromEntries(READMES.map(file => [file, tableRows(readme[file]).map(row => row.repo).join(' ')]))
if (ordered['README.md'] !== ordered['README.zh.md']) {
  fail('README.zh.md', `its tables list\n    ${ordered['README.zh.md']}\n  and README.md lists\n    ${ordered['README.md']}`)
}

/* ───────────────────────────── the applications ──────────────────────────── */

// Nothing on disk answers for these three: they carry no bundle patch, so the
// registry has no row for them, and `omdsh-webapp` is not even a directory here.
// What is checkable is that the three places naming them agree.
const appsOnSite = [...section('apps').matchAll(/<h3>([a-z0-9-]+)<\/h3>/gu)].map(([, name]) => name)
sameSet(SITE, 'applications', 'README.md', applications['README.md'], appsOnSite)
sameSet('README.zh.md', 'applications', 'README.md', applications['README.md'], applications['README.zh.md'])

/** How many applications there are, as README.md lists them — the count every document repeats. */
const appCount = applications['README.md'].length

/* ──────────────────────────────── the counts ─────────────────────────────── */

/** Numbers as English words, for prose that spells them out. */
const IN_ENGLISH = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']

/** The same, in Chinese. */
const IN_CHINESE = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']

/** What a count looks like in any of the three notations the documents use. */
const COUNT = String.raw`([0-9]+|[A-Za-z]+|[零一二三四五六七八九十]+)`

/**
 * Whether a captured token means a given number, written any of the three ways.
 * @param {string} token - what the anchor captured.
 * @param {number} value - what it should say.
 * @returns {boolean} whether it does.
 */
function denotes(token, value) {
  const found = token.trim()
  return found === String(value) || found.toLowerCase() === IN_ENGLISH[value] || found === IN_CHINESE[value]
}

/** How many rules the conventions are, and therefore how many the prose claims. */
const ruleCount = [...conventions.en.matchAll(/^### \d+\. /gmu)].length

/**
 * Every sentence that states a count, and what the count is.
 *
 * A count is the one fact in this document set that is duplicated more than it
 * is read: the same twelve is in the tab bar, the hero, the section heading and
 * the filter. The anchors are deliberately tight — when a sentence is rewritten
 * the anchor stops matching, and this script says so rather than passing
 * quietly, because an anchor that silently checks nothing is worse than no
 * anchor at all.
 * @type {Array<{ file: string, what: string, pattern: string, counts: number[] }>}
 */
const COUNT_ANCHORS = [
  {
    file: SITE,
    what: 'the navigation',
    pattern: `插件 ${COUNT}</span><span class="en">Plugins ${COUNT}`,
    counts: [plugins.length, plugins.length],
  },
  {
    file: SITE,
    what: 'the navigation',
    pattern: `应用 ${COUNT}</span><span class="en">Apps ${COUNT}`,
    counts: [appCount, appCount],
  },
  {
    // Twice over: the hero's thesis, and the meta description that repeats it
    // for a search result and a link preview.
    file: SITE,
    what: 'the thesis',
    pattern: `${COUNT} 个插件、${COUNT} 个应用、${COUNT} 份注册表`,
    counts: [plugins.length, appCount, 1],
  },
  {
    file: SITE,
    what: 'the thesis',
    pattern: `${COUNT} plugins, ${COUNT} applications, ${COUNT} registry`,
    counts: [plugins.length, appCount, 1],
  },
  {
    file: SITE,
    what: 'the hero statistics',
    pattern: `<b>${COUNT}</b><span class="cap"><span class="zh">插件</span>`,
    counts: [plugins.length],
  },
  {
    file: SITE,
    what: 'the hero statistics',
    pattern: `<b>${COUNT}</b><span class="cap"><span class="zh">应用`,
    counts: [appCount],
  },
  {
    file: SITE,
    what: 'the hero statistics',
    pattern: `<b>${COUNT}</b><span class="cap"><span class="zh">分类</span>`,
    counts: [perCategory.size],
  },
  {
    file: SITE,
    what: 'the catalog heading',
    pattern: `插件目录 · ${COUNT} 个仓库</span><span class="en">Catalog · ${COUNT} repositories`,
    counts: [plugins.length, plugins.length],
  },
  {
    file: SITE,
    what: 'the applications heading',
    pattern: `应用 · ${COUNT} 个仓库</span><span class="en">Applications · ${COUNT} repositories`,
    counts: [appCount, appCount],
  },
  {
    file: SITE,
    what: 'the conventions heading',
    pattern: `公约 · ${COUNT}条规则</span><span class="en">Conventions · the ${COUNT} rules`,
    counts: [ruleCount, ruleCount],
  },
  {
    file: 'README.md',
    what: 'what is in here',
    pattern: `${COUNT} plugins, ${COUNT} applications, and ${COUNT} catalog`,
    counts: [plugins.length, appCount, 1],
  },
  {
    file: 'README.md',
    what: 'the conventions',
    pattern: `${COUNT} rules, a checklist`,
    counts: [ruleCount],
  },
  {
    file: 'README.zh.md',
    what: 'what is in here',
    pattern: `${COUNT}个插件、${COUNT}个应用、${COUNT}份目录清单`,
    counts: [plugins.length, appCount, 1],
  },
  {
    file: 'README.zh.md',
    what: 'the conventions',
    pattern: `${COUNT}条规则`,
    counts: [ruleCount],
  },
]

const source = documents

for (const anchor of COUNT_ANCHORS) {
  const matches = [...source[anchor.file].matchAll(new RegExp(anchor.pattern, 'gu'))]
  if (matches.length === 0) {
    fail(anchor.file, `${anchor.what} no longer reads as this script expects — the sentence moved, so update the anchor in scripts/check-docs.mjs:\n    /${anchor.pattern}/`)
    continue
  }
  for (const match of matches) {
    // Located rather than merely named: the same sentence is often on the page
    // twice — the thesis and the meta description that repeats it — and two
    // identical messages would read as one problem reported twice.
    const where = `${anchor.file}:${String(lineAt(source[anchor.file], match.index))}`
    for (const [index, expected] of anchor.counts.entries()) {
      const found = match[index + 1]
      if (!denotes(found, expected)) {
        fail(where, `${anchor.what} says ${found} where the collection has ${String(expected)}: "${text(match[0]).slice(0, 72)}"`)
      }
    }
  }
}

/* ────────────────────────────── the toolchain ────────────────────────────── */

/** The harness release the collection is built against, from the root manifest. */
const harness = manifest.dependencies['@deepseek-ai/dsh'].replace(/^[\^~]/u, '')

/** The Node range and the pnpm release, likewise. */
const node = manifest.engines.node
const pnpm = manifest.packageManager.replace(/^pnpm@/u, '')

// The site prints the harness release three times — the hero pin, the desktop
// card's chip, the footer — and the READMEs never print it at all, so the site
// is the only place this can go stale.
for (const match of site.matchAll(/\bdsh (\d[\w.-]*)/gu)) {
  if (match[1] !== harness) {
    fail(`${SITE}:${String(lineAt(site, match.index))}`, `it prints dsh ${match[1]}, the root package.json depends on ${harness}`)
  }
}

/**
 * Assert one document prints a toolchain fact exactly as the manifest states it.
 *
 * Exactly, not approximately: `>=24` where the manifest says `>=24.0.0` reads
 * the same to a person and is the beginning of the two drifting apart.
 * @param {string} file - the document.
 * @param {RegExp} pattern - one capture group holding what it printed.
 * @param {string} expected - what the root manifest says.
 * @param {string} what - the fact's name, for the message.
 */
function printsExactly(file, pattern, expected, what) {
  const found = pattern.exec(source[file])
  if (found === null) {
    fail(file, `it no longer states the ${what} where this script looks — update the anchor in scripts/check-docs.mjs:\n    ${String(pattern)}`)
    return
  }
  const printed = decode(found[1]).trim()
  if (printed !== expected) fail(file, `it states ${what} ${printed}, the root package.json says ${expected}`)
}

printsExactly(SITE, /<span class="k">node<\/span>([^<]*)</u, node, 'Node range')
printsExactly(SITE, /<span class="k">pnpm<\/span>([^<]*)</u, pnpm, 'pnpm release')
printsExactly('README.md', /Node `([^`]*)`/u, node, 'Node range')
printsExactly('README.md', /and pnpm ([\d.]+)\./u, pnpm, 'pnpm release')
printsExactly('README.zh.md', /Node `([^`]*)`/u, node, 'Node range')
printsExactly('README.zh.md', /以及 pnpm ([\d.]+)。/u, pnpm, 'pnpm release')

/* ──────────────────────────── the download links ─────────────────────────── */

/**
 * Every desktop release URL a document offers, deduplicated.
 * @param {string} document - the README or the page.
 * @returns {string[]} the URLs, sorted.
 */
function downloads(document) {
  const found = document.matchAll(new RegExp(String.raw`https://github\.com/${UPSTREAM}/omdsh-desktop/releases/[^"')\s]+`, 'gu'))
  return [...new Set([...found].map(([url]) => url))].sort()
}

// Three documents offer the same two installers and the same releases page. A
// release moves all of them at once or none of them, and "none of them" is a
// download button pointing at a version that no longer exists.
const offered = downloads(readme['README.md'])
if (offered.length === 0) fail('README.md', 'it offers no desktop download at all — this script expects the release links to live here')
sameSet('README.zh.md', 'desktop release links', 'README.md', offered, downloads(readme['README.zh.md']))
sameSet(SITE, 'desktop release links', 'README.md', offered, downloads(site))

/* ───────────────────────────────── the rules ─────────────────────────────── */

/**
 * The nine rule titles, as a Markdown convention document numbers them.
 * @param {string} document - CONVENTIONS.md or its translation.
 * @returns {string[]} the titles, in order.
 */
function ruleTitles(document) {
  return [...document.matchAll(/^### \d+\. (.+)$/gmu)].map(([, title]) => text(title))
}

// The rules page is a mirror of the two convention documents; the front page
// summarises them. Both must have all of them, and the mirror must say the same
// thing the document says — in both languages, since a translated title that
// drifts is how one language quietly starts describing a different rule.
const summarised = [...section('conventions').matchAll(/<h4>([\s\S]*?)<\/h4>/gu)].length
if (summarised !== ruleCount) {
  fail(SITE, `it summarises ${String(summarised)} rules, CONVENTIONS.md has ${String(ruleCount)}`)
}

const mirrored = [...rulesPage.matchAll(/<section class="rule-sec" id="rule-\d+">[\s\S]*?<h2>([\s\S]*?)<\/h2>/gu)]
if (mirrored.length !== ruleCount) {
  fail(RULES_PAGE, `it carries ${String(mirrored.length)} rules, CONVENTIONS.md has ${String(ruleCount)}`)
}

const titles = { zh: ruleTitles(conventions.zh), en: ruleTitles(conventions.en) }
if (titles.zh.length !== titles.en.length) {
  fail(CONVENTIONS.zh, `it has ${String(titles.zh.length)} rules and ${CONVENTIONS.en} has ${String(titles.en.length)}`)
}

for (const [index, [, heading]] of mirrored.entries()) {
  const pair = bilingual(heading)
  if (pair === undefined) {
    fail(RULES_PAGE, `rule ${String(index + 1)} has no zh/en title pair`)
    continue
  }
  for (const language of /** @type {const} */ (['zh', 'en'])) {
    const expected = titles[language][index]
    if (expected !== undefined && pair[language] !== expected) {
      fail(RULES_PAGE, `rule ${String(index + 1)} is titled "${pair[language]}", ${CONVENTIONS[language]} says "${expected}"`)
    }
  }
}

/* ────────────────────── the plugins that own a namespace ─────────────────── */

/** Every plugin that registers a settings namespace, by unscoped name. */
const configurable = plugins.filter(plugin => plugin.settings.length > 0).map(plugin => plugin.repo).sort()

// The READMEs name them in a sentence rather than a table, and the sentence
// counts them first — which makes it the one line in either document that is
// wrong twice over the day a plugin grows a settings schema.
for (const [file, pattern] of /** @type {const} */ ([
  ['README.md', /^([A-Za-z]+) plugins own a namespace: (.+?)\. /mu],
  ['README.zh.md', /^有([零一二三四五六七八九十]+)个插件拥有自己的命名空间：(.+?)。/mu],
])) {
  const sentence = pattern.exec(readme[file])
  if (sentence === null) {
    fail(file, `it no longer names the plugins that own a settings namespace where this script looks — update the anchor in scripts/check-docs.mjs:\n    ${String(pattern)}`)
    continue
  }
  if (!denotes(sentence[1], configurable.length)) {
    fail(file, `it counts ${sentence[1]} plugins with a settings namespace, ${String(configurable.length)} register one`)
  }
  sameSet(file, 'plugins named as owning a settings namespace', 'the registry', configurable, [...sentence[2].matchAll(/`([^`]+)`/gu)].map(([, name]) => name))
}

/* ─────────────────────────── the style contract ──────────────────────────── */

/**
 * The documentation style, applied to the documents in this repository.
 *
 * `README-STYLE.md` says what every README here agrees to look like, and the
 * parts of it a machine can hold are read out of the document itself rather
 * than restated here: the language switcher comes from the code blocks in its
 * rule 2, the fixed Chinese section names from the table in its rule 10. A
 * style document that some script paraphrases is two documents.
 *
 * What is checked is the structural half — the switcher, the heading skeleton,
 * the two languages saying the same thing. Sentence case is deliberately not:
 * the rule allows proper nouns and quoted UI strings (`New Session` is a
 * button), so any check for it would either miss the real cases or shout at
 * correct headings, and a check nobody trusts gets disabled.
 *
 * It reaches the six documents in this repository and no further. Every plugin
 * README the style is really addressed to lives in a repository of its own,
 * ignored here and absent from a clone — those are checked where they live, or
 * not at all.
 */

/** Every document here that is written twice. */
const BILINGUAL = [
  { en: 'README.md', zh: 'README.zh.md' },
  { en: STYLE.en, zh: STYLE.zh },
  { en: CONVENTIONS.en, zh: CONVENTIONS.zh },
]

/**
 * A document's headings, with the fenced blocks skipped.
 *
 * The skeleton in README-STYLE's own rule 0 is a fenced markdown block full of
 * `##` lines, and counting those as headings would make the style document
 * fail its own rule.
 * @param {string} document - the Markdown.
 * @returns {Array<{ level: number, title: string, line: number }>} the headings.
 */
function headings(document) {
  const found = []
  let fenced = false
  for (const [index, line] of document.split('\n').entries()) {
    if (line.startsWith('```')) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const heading = /^(#{1,6}) (.+)$/u.exec(line)
    if (heading !== null) found.push({ level: heading[1].length, title: heading[2].trim(), line: index + 1 })
  }
  return found
}

/**
 * A document's fenced blocks, as the language each is tagged with.
 * @param {string} document - the Markdown.
 * @returns {string[]} one entry per block, in order.
 */
function fences(document) {
  const found = []
  let open = false
  for (const line of document.split('\n')) {
    if (!line.startsWith('```')) continue
    if (!open) found.push(line.slice(3).trim())
    open = !open
  }
  return found
}

/**
 * The two language-switcher lines, read from README-STYLE's rule 2.
 * @returns {{ en: string, zh: string } | undefined} the templates, or undefined
 *   when the rule no longer holds them where this looks.
 */
function switcherTemplates() {
  const style = documents[STYLE.en]
  const start = style.search(/^### \d+\. Line 3 is the language switcher/mu)
  if (start < 0) return undefined
  const rest = style.slice(start + 1)
  const end = rest.search(/^### /mu)
  const rule = end < 0 ? rest : rest.slice(0, end)
  const blocks = [...rule.matchAll(/^```markdown\n([^\n]*)\n```$/gmu)].map(([, line]) => line.trim())
  return blocks.length === 2 ? { en: blocks[0], zh: blocks[1] } : undefined
}

/** The fixed Chinese section names, read from the table in README-STYLE's rule 10. */
function sectionNames() {
  const table = /\| English \| 中文 \|\n\|[-| ]+\|\n((?:\|.*\|\n?)+)/u.exec(documents[STYLE.en])
  if (table === null) return undefined
  /** @type {Map<string, string>} */
  const names = new Map()
  for (const row of table[1].split('\n')) {
    const cells = row.split('|').slice(1, -1).map(cell => cell.trim())
    if (cells.length !== 2) continue
    // `Layout / Packages | 目录结构 / 包` is two names on each side, paired in order.
    const english = cells[0].split(' / ')
    const chinese = cells[1].split(' / ')
    if (english.length !== chinese.length) continue
    for (const [index, name] of english.entries()) names.set(name, chinese[index])
  }
  return names.size > 0 ? names : undefined
}

const switcher = switcherTemplates()
if (switcher === undefined) {
  fail(STYLE.en, 'its rule on the language switcher no longer holds the two lines in a pair of markdown blocks, so this script cannot read what the switcher is')
}

const sections = sectionNames()
if (sections === undefined) {
  fail(STYLE.en, 'its "| English | 中文 |" table of fixed section names is gone, so this script cannot read what a translated heading should be')
}

for (const pair of BILINGUAL) {
  // Rule: line 3 is the language switcher, byte for byte — with this document's
  // own sibling named. Everything in this repository links its translation
  // there, and `scripts/build-profile.mjs` rewrites that exact line, so it is
  // load-bearing twice over.
  if (switcher !== undefined) {
    const expected = {
      en: switcher.en.replace('README.zh.md', pair.zh),
      zh: switcher.zh.replace('README.md', pair.en),
    }
    for (const language of /** @type {const} */ (['en', 'zh'])) {
      const line = documents[pair[language]].split('\n')[2]
      if (line !== expected[language]) {
        fail(`${pair[language]}:3`, `its line 3 is "${line}", and the style says the language switcher is "${expected[language]}"`)
      }
    }
  }

  const structure = { en: headings(documents[pair.en]), zh: headings(documents[pair.zh]) }

  // Rule: the two languages say the same thing — same headings, in the same
  // order, at the same levels. Reported as the first place they part company,
  // because after that every line disagrees and listing them all says nothing.
  const aligned = structure.en.length === structure.zh.length
  if (!aligned) {
    fail(pair.zh, `it has ${String(structure.zh.length)} headings and ${pair.en} has ${String(structure.en.length)}`)
  }
  // Over the common prefix, so a document with one heading too many is reported
  // as that and not also as every heading after it being the wrong one.
  const parted = structure.en.findIndex((heading, index) => structure.zh[index] !== undefined && structure.zh[index].level !== heading.level)
  if (parted >= 0) {
    const here = structure.en[parted]
    const there = structure.zh[parted]
    fail(`${pair.zh}:${String(there.line)}`, `its headings stop matching ${pair.en}:${String(here.line)} — "${here.title}" is a level ${String(here.level)} heading, "${there.title}" is level ${String(there.level)}`)
  }

  // Rule: the fixed section names, wherever one of them is used. Only once the
  // two documents line up: pairing by position through a document that has
  // already diverged compares headings that were never counterparts.
  if (sections !== undefined && aligned && parted < 0) {
    for (const [index, heading] of structure.en.entries()) {
      const translated = sections.get(heading.title)
      const counterpart = structure.zh[index]
      if (translated === undefined || counterpart === undefined) continue
      if (counterpart.title !== translated) {
        fail(`${pair.zh}:${String(counterpart.line)}`, `"${heading.title}" is "${counterpart.title}" here, and the style fixes it as "${translated}"`)
      }
    }
  }

  // Rule: same code blocks. Their languages, in order — a `sh` block that
  // became prose in translation is a command a reader in one language cannot
  // copy.
  const tagged = { en: fences(documents[pair.en]), zh: fences(documents[pair.zh]) }
  if (tagged.en.join(' ') !== tagged.zh.join(' ')) {
    fail(pair.zh, `its code blocks are [${tagged.zh.join(', ')}] and ${pair.en} has [${tagged.en.join(', ')}]`)
  }

  for (const file of [pair.en, pair.zh]) {
    const structured = headings(documents[file])

    // Rule: no `## License`. The LICENSE file and package.json both say it, and
    // GitHub renders both.
    const licence = structured.find(heading => /^(license|licence|许可|开源协议)/iu.test(heading.title))
    if (licence !== undefined) fail(`${file}:${String(licence.line)}`, `it has a "${licence.title}" section, and the style has no license section`)

    // Rule: never skip a level.
    for (const [index, heading] of structured.entries()) {
      const previous = structured[index - 1]
      if (previous !== undefined && heading.level > previous.level + 1) {
        fail(`${file}:${String(heading.line)}`, `"${heading.title}" is a level ${String(heading.level)} heading under a level ${String(previous.level)} one, and the style skips no level`)
      }
    }

    // Rule: known limitations is last, and nothing follows it. Checked where a
    // document has one — the style document and the conventions are not
    // READMEs and carry no such section.
    const limits = structured.findIndex(heading => heading.level === 2 && (heading.title === 'Known limitations' || heading.title === sections?.get('Known limitations')))
    if (limits >= 0 && limits !== structured.length - 1) {
      fail(`${file}:${String(structured[limits + 1].line)}`, `"${structured[limits + 1].title}" follows the limitations section, and the style ends every README there`)
    }

    // Rule: install comes before commands — a reader decides they want it
    // before being told how to get it.
    const order = ['Install', 'Commands'].map(name => structured.findIndex(heading => heading.title === name || heading.title === sections?.get(name)))
    if (order.every(index => index >= 0) && order[0] > order[1]) {
      fail(`${file}:${String(structured[order[0]].line)}`, 'its install section comes after its commands section, and the style puts install first')
    }
  }
}

// Rule: the title is the bare name, which for this repository is the one the
// manifest carries.
for (const file of READMES) {
  const title = headings(documents[file])[0]
  if (title?.title !== manifest.name) {
    fail(`${file}:1`, `its title is "${title?.title ?? '(none)'}", and the style makes it the bare package name, "${manifest.name}"`)
  }
}

// Rule: the lead links the harness on first mention, so a reader who arrived
// from a search engine learns what this is a plugin for without leaving the
// paragraph.
const HARNESS_LINK = '](https://github.com/deepseek-ai/deepseek-harness)'
for (const file of READMES) {
  const lead = documents[file].split('\n\n').slice(0, 3).join('\n\n')
  if (!lead.includes(HARNESS_LINK)) {
    fail(file, 'its lead paragraph does not link the DeepSeek Harness, which the style asks for on first mention')
  }
}

/* ─────────────────────────────────── done ────────────────────────────────── */

if (problems.length > 0) {
  console.error(`the site and the READMEs disagree with the packages in ${String(problems.length)} place${problems.length === 1 ? '' : 's'}:\n`)
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('\nfix the document, not this script — unless a sentence moved, in which case move its anchor with it.')
  process.exit(1)
}

console.log(`docs are current (${String(plugins.length)} plugins, ${String(appCount)} applications, ${String(ruleCount)} rules, ${String(perCategory.size)} categories)`)
