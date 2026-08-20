# omdsh 插件约定

[English](CONVENTIONS.md) | 中文

这个目录下的插件都遵守同一套约定，目的只有一个：让
[`omdsh-plughub`](omdsh-plughub/) 在完全不认识某个插件的前提下，也能把它列出
来、装上去、配起来。

规则很短，因为它们几乎全是"用 harness 已有的那道接缝"。如果插件中心需要每个插
件教它一点东西，那每来一个新插件就得改一次插件中心；而现在它什么都不用改——它
渲染的每一样东西，都是从插件自己已经声明的内容里读出来的。

## 九条约定

### 1. 可配置项 = 一个 settings 命名空间

有配置项的插件注册**一个** settings 命名空间，名字取自它去掉 scope 的包名，并
附上一份 [schemastery] schema：

```ts
export const SETTINGS_NAMESPACE = 'omdsh-shortcuts'

export const Config: Schema<ShortcutConfig, Required<ShortcutConfig>> = Schema.object({ /* … */ })

ctx.inject?.(['settings'], (sctx) => {
  const settings = sctx.get?.('settings') as SettingsLike | undefined
  if (settings === undefined) return
  const scope = settings.register(SETTINGS_NAMESPACE, Config, {
    base: config,          // 组装层的 entry config 留在用户改动的下面一层
    applies: 'live',       // 或 'restart'，见第 4 条
    validate: value => { /* schema 表达不了的跨字段校验 */ },
  })
  adopt(scope.get())
  sctx.effect(() => scope.watch(next => { adopt(next) }))
})
```

命名空间必须匹配 `^[a-z][a-z0-9-]*$`，settings 服务不接受别的形状。

有三处细节是承重的：

- **`base: config`。** cordis patch 里的配置成为用户改动下面的那个图层，所以在
  profile 里配置过的插件仍按那份配置跑，面板也能显示哪些字段是人真正动过的。
- **`ctx.inject(['settings'], …)`。** 这段注册挂在一个受限 fiber 上，所以没有
  settings provider 的组装（headless、测试台）照旧按 entry config 运行。可配置
  性是加法，不是前提。
- **按名字解析服务。** 在 harness 之外编译的包，会把浏览器半边和 host 半边当成
  同一个程序做类型检查，所以 `ctx.settings` 是编译器先看到的那份 `Context` 声
  明。要用 `ctx.get('settings')` 加一个结构化类型。

除此之外什么都不需要。`omdsh-plughub` 的 host 半边用
`ctx.settings.describe({ redactSecrets: true })` 读到这个命名空间，带给自己的
面板，按 schema 渲染表单，再用 `ctx.settings.mutate` 写回去。校验、持久化、
base/user 分层、密钥脱敏、并发冲突、热生效——全是 harness 的，已经写好了。

（插件中心走的是自己的一条路由，而不是 harness 的 `settings.describe` RPC——
那条 RPC 有一份写死的命名空间名单挡着，任何 out-of-tree 插件都进不去。那是插件
中心要操心的事，不是你的——上面那段代码不会因此有任何不同。）

### 2. schema 自带文案

每个字段都用 `.description()` 写说明，并用 `.i18n({ zh: { … } })` 本地化：

```ts
Schema.object({
  bindings: Schema.dict(Schema.string())
    .description('Keyboard shortcut per command id, as an Electron accelerator.'),
}).i18n({
  zh: { bindings: '每个命令 id 对应的快捷键，写作 Electron accelerator。' },
})
```

`.i18n()` 会把说明序列化成一张以 `''` 为默认值的 locale 映射表，插件中心按当前
语言取用。**没有插件需要向插件中心注册字典**，插件中心里也没有哪本字典会随着插
件数量增长——正是这一条，让明年才写出来的插件在装上的当天，就能在中英文下都显
示正确的字段名。

description 请写成**完整的句子**。插件中心会用属性名生成控件标题（`maxRepos` →
`Max repos`），把 description 放在标题下面，读起来和 harness 自带的设置行一个
样。

`.comment()` 是控件下方的补充说明，`.link()` 是控件旁边的文档链接，
`.hidden()` 让表单跳过这个字段，数字字段还有 `.min()` / `.max()` / `.step()`。

### 3. 密钥要声明，不能指望

存放凭据的字段加 `.role('secret')`。传输时会把它从每个响应里剥掉，只报告"有没
有存过值"，插件中心据此渲染一个只写控件。没声明的密钥，会以明文发给每一个打开
面板的浏览器。

### 4. 老实说明什么时候生效

`applies: 'live'`（默认）表示提交即生效；`applies: 'restart'` 表示不是。插件中
心会在卡片上标出"重启后生效"，免得有人改完之后纳闷为什么没反应。

尽量用 `live`。它通常只是多一个 `watch` 回调，把从配置推导出来的东西重算一
遍：`omdsh-shortcuts` 是重建菜单文档，然后推给已经开着的那几条流。这正是"一个
设置项"和"一个改完就得重启的东西"之间的区别。

### 5. 在 `package.json` 里声明展示元数据

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

每个字段都是可选的。什么都不声明的插件照样会出现，只是用包名当标题；
`settings` 缺省时回落到去掉 scope 的包名——所以**只做到第 1 条就已经可配置
了**。

**这个仓库里每个插件都声明 `displayName`，而且写法统一。** 英文一律 Title
Case，每个词首字母大写：`Remote Control`、`Side Panels`、`Usage`。词要写全，不
用包名里的缩写——包名是拿来敲的，所以会缩（`omdsh-remctrl`）；标题是拿来读的，
所以不缩（`Remote Control`）。写它**是什么**，而不是把归档用的代号再念一遍：叫
`Chat Mode`，不叫 `Chatmode`。中文名照着旁边 `summary` 的译法翻。插件中心不再
把标题折成小写了，所以 manifest 里写什么样，面板上就显示什么样。

回落仍然留着，给这个仓库之外的插件和 harness 自带的 bundle 用：什么都没声明，
卡片就用 npm 上那个包名当标题（`dsh-web-app`）。这才是老实的渲染——没人给它们
起过标题，标识符就该长成标识符的样子。

只有当插件持有的命名空间不叫它自己的名字、或者不止一个时，才需要显式写
`settings`。

`dsh.bundle.patch` 决定一个包能不能装：`dsh plugin` 只在这个依赖的 manifest
声明了它的时候，才把这个依赖加进 profile 的图层栈。

### 6. 表单画不出来的控件，用卡片

通用表单能画字符串、数字、布尔、闭合枚举、字符串列表、字符串字典和嵌套对象。
除此之外它拒绝渲染，而不是去猜——猜出来的控件会写进错误的形状，还能通过校验，
但含义已经变了。

当插件需要一个表单画不出来的控件时（比如"按一下捕获快捷键"，而不是往输入框里
敲 `Ctrl+K`），它的浏览器半边就往插件中心的槽位里注册一张卡片，**id 用包名**：

```ts
ctx.slots.inject('omdsh.plugin.card', () => ctx.slots.register({
  name: 'omdsh.plugin.card',
  id: '@omdsh-plugins/omdsh-shortcuts',
  inject: () => ({ /* 你自己的 face */ }),
}, ChordCaptureCard))
```

这张卡片会**代替**该插件的通用表单。插件仍然持有自己的 settings 命名空间，仍
然通过 `settings.mutate` 写入——这个逃生舱换掉的只是控件长什么样，不是值存在
哪里。

### 7. `version` 用 semver，发布时记得升

插件中心的更新按钮只由一次比较点亮：目录来源声明的版本，对上磁盘上那个包的版
本，按 semver 排序。所以 `version` 字段不是流水账——它是别人能收到的**唯一**
一个"有新版本了"的信号。

由此有三件事。

**发布时要升。** 用同一个版本号推新代码，等于让每个已安装的副本都报"已是最
新"，没人会被提示有这次改动。

**要能解析。** `2024.03`、`latest`、`1.2` 都不是 semver，比较得不出答案，插件
中心会报 `unknown`，而不是猜一个方向。预发布版没问题，顺序也是对的：
`1.0.0-rc.2` 在 `1.0.0-rc.10` 之前，两者都在 `1.0.0` 之前。

**别指望它对签出目录安装有用。** `dsh plugin add <路径>` 记的是 `link:` 依赖，
装进去的文件**就是**那个签出目录，两个版本号是同一个文件。插件中心会把这种情况
报成 `linked` 而不是"已是最新"，因为本来就没什么可拉的。

**别忘了同步清单里的那一行。** 插件中心的默认目录是
[`omdsh-plugins/registry`][registry] 里的策展清单——所以别人拿来比较的版本是
**那个文件**声明的版本，不是你默认分支上的。清单由这些 `package.json` 生成，所
以一次发布是两次推送：先推插件，再跑 `node registry/build.mjs`，然后推
registry。

[registry]: https://github.com/omdsh-plugins/registry

### 8. 三件不能做的事

- **改 `deepseek-harness`。** 它是一个保持干净、能跟上上游的 fork；在那里打的
  补丁，下次同步时不是丢失就是冲突。所有功能都以 out-of-tree bundle 交付。如果
  缺一道接缝，就从这个目录里的某个插件身上取。
- **提交 `link:` 依赖。** pnpm 会相对声明它的 manifest 解析，等于把某一台机器
  的目录结构写死了——而且它**静默失败**：悬空软链、"安装成功"，然后每一个
  harness import 都 TS2307。该提交的是 registry 版本号，用
  `harness:local <path>` / `harness:npm` 脚本切换，外加一个只要还链着就失败的
  `check:harness-pin`。
- **在浏览器半边 value-import 另一个插件。** client bundle 的纯度栅栏禁止这件
  事：跨插件的 value import，要么把另一个插件的运行时内联出第二份副本，要么向
  冻结的模块表要一个它答不上来的 specifier。协作要走 cordis 服务和槽位；
  type-only import 会被擦除，没有问题。怎么依赖一个服务，见第 9 条。

### 9. 别的插件发布的服务，绝不写进你的 `inject`

harness 自己的服务——`slots`、`sessions`、`workspaces`、`workspaceRegistry`、
`locale`、`connection`、`webServer`、`webRuntime`、`settings`、
`sessionProjections`、`invariants`——由 `dsh-base` 和 surface bundle 组装，所以
顶层 `inject` 写它们总能解析。（判据是一个名字由谁组装，而不是它在不在上面这份
名单里：`webRuntime` 来自 web-app 这个 surface bundle，所以写它的插件是在声明
自己需要那个界面——对一个有浏览器半边的插件来说，这是诚实的说法。）而这个目录
里另一个插件发布的服务（omdsh-chatmode 的 `sessionModes`、omdsh-shortcuts 的
`shortcut`、omdsh-remdev 的 `remdev`）是另一类事实：它在不在，是 **profile**
的属性，而 profile 是人用 `dsh plugin add` 一条一条装出来的。

cordis 对注入的服务会一直等下去，所以一个声明了"没人组装的服务"的 entry 会永
远停在 `pending`。而两侧的启动审计见到任何非 active 的 entry 都会让整个应用失
败——host 侧是 `assertEntriesActivated`，浏览器侧是 `dsh-client-web` 在插件树
静默之后的那一遍扫描：

```
web boot: 1 entry did not activate
@omdsh-plugins/omdsh-codemode: pending (waiting for service: sessionModes)
```

这是一个**死掉的界面**，不是一个被关掉的功能——少装一个配套插件，整个页面陪
葬，连跟它毫无关系的插件也一起没了。所以：**别的插件的服务要在 `apply` 里面
取，绝不写进 `inject`。** 两种写法，仓库里都已经有：

- **受限 fiber**，当这个依赖有生命周期时——它在就挂载，它走就卸载：

  ```ts
  export const inject = ['slots', 'sessions', 'locale']   // 只写 harness 服务

  export function apply(ctx: ClientContext): void {
    ctx.inject([SESSION_MODES], (mctx) => {
      const modes = mctx.get(SESSION_MODES) as SessionModes | undefined
      // 服务由一个并非 active 的 fiber 提供时会走到这里。
      if (modes === undefined) return
      mountMode(mctx, modes)
    })
  }
  ```

  在 `apply` 里起的 fiber 不是 loader entry，所以永远等下去也没有代价。
  effect 要挂在 `mctx` 而不是 `ctx` 上，这样提供方一旦在运行时卸载，就会把你
  的注册一并带走。

- **惰性读取**，当你只在某件事发生的那一刻才需要它时：
  `ctx.get('remdev') as RemdevFace | undefined`，取不到就自己给出答案。

这就是第 1 条里 `ctx.inject(['settings'], …)` 的推广，理由也一样：依赖另一个
插件是加法，不是前提。在 README 里说清楚关闭状态是什么样——并确保它是"什么都
不做"，而不是"炸掉"。

## 新插件自查表

- [ ] `package.json` 声明了 `dsh.bundle.patch`；有浏览器半边的还要声明
      `dsh.client`
- [ ] `package.json` 声明了 `dsh.plughub` 展示元数据
- [ ] host 半边导出 schemastery `Config`，每个字段都有本地化的 description
- [ ] 通过 `ctx.inject(['settings'], …)` 注册命名空间，`base` 设为组装图层的
      entry config
- [ ] 凭据字段标了 `.role('secret')`
- [ ] `applies` 说的是实话
- [ ] 顶层 `inject` 里没有任何"别的插件发布的服务"；没装它的 profile 能正常
      启动，README 里写清楚了关闭状态是什么样
- [ ] `version` 是 semver，发布时会升
- [ ] harness 依赖是提交下来的 registry 版本号，不是 `link:`
- [ ] harness 的 `peerDependencies` 写**范围**，绝不写 `*`。npm 上每个
      `@deepseek-ai/dsh-*` 版本都是预发布版，所以 `latest` 标签至今仍指向最早
      发布的那一个——而 `*` 会听从 `latest`。这在 workspace 里察觉不到：那里
      harness 是通过各包钉住的 devDependencies 解析的，安装、构建、测试和
      `check:harness-pin` 全都通过，发布出去的包却根本装不上
- [ ] 裸 clone 下 `pnpm install && pnpm run build && pnpm run typecheck`
- [ ] 裸 clone 下 `pnpm test` 跑得过它那些只用 node 的用例，而在
      `pnpm run harness:local <path> && pnpm install` 之后跑得过全部。已发布的
      harness 包不带源码，所以浏览器用例对着 pin 是跑不了的——把那些说明符
      alias 到一个守卫模块上，让它抛错并给出这条指示，而不是让整个 vitest 配
      置失败，那会把只用 node 的用例一起带下去。提交前用 `harness:npm` 切回
      来；忘了的话，`check:harness-pin` 就是那道拦你的关

## 一个完整的例子

`omdsh-shortcuts` 是参照实现。它的配置正好沿着第 1 条画出的那条线分成两半：

- `items`——有哪些命令、显示成什么、由谁执行。属于组装图层的事实，对表单
  `.hidden()`，在 profile 的 patch 文件里改。
- `bindings`——哪个键触发哪个命令。属于人的事实，一张扁平的 `dict(string)`，
  在插件中心里改。

读一遍 `src/bindings.ts` 和 `src/index.ts` 末尾那段 settings 注册，是给另一个
插件写出同样东西的最短路径。

[schemastery]: https://github.com/shigma/schemastery
