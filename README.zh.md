# omdsh-plugins

[English](README.md) | 中文

一组给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 用的插件：网页版的几种模式、会话列周围的各种面板、两条把它自己读不了的东西（文档、图片）递给它的路、一条通往别的机器的路、一份键盘映射、两个顶栏读数（花费，和项目与 git 状态），以及一个能在设置里把其余这些装上、卸掉、配好的插件中心。外加三个用来跑它们的应用，和一份让插件中心找得到它们的目录清单。

**这里没有一行改动落在 harness 上。** 每一个功能都以 out-of-tree bundle 的形式发布，由 profile 组合在 `dsh-base` 之上，走的全是 harness 本来就公开的接缝：一个槽位、一个服务、一个 settings 命名空间、一条路由。这条约束就是整个设计——harness 得以保持成一个能跟上游走的干净 fork，而明年才写出来的插件，装进今天组好的 profile 里时，两边谁也不需要知道对方。

## 这里都有什么

十四个插件、三个应用、一份目录清单。

### 模式——中间那一列是什么

| 包 | 它提供什么 |
|---|---|
| [omdsh-basemode](https://github.com/omdsh-plugins/omdsh-basemode) | 会话模式系统：所有模式插件注册分段用的那个注册表、渲染它们的那个开关，以及按模式给侧栏上色的圆点。它自己不发明模式，但贡献一个：**Work**，也就是 harness 自己的那根列，好让开关永远有地方可以切回去。 |
| [omdsh-chatmode](https://github.com/omdsh-plugins/omdsh-chatmode) | **Chat** 和 **Work**。Chat 不用先选项目目录就能开始对话，这些对话统一收在一个托管工作区里。 |
| [omdsh-codemode](https://github.com/omdsh-plugins/omdsh-codemode) | **Code**。在对话所属的工作区里开一个 harness 终端，它本身就是那一列，而不是列旁边的东西。 |

### 会话列周围

| 包 | 它提供什么 |
|---|---|
| [omdsh-sidepanel](https://github.com/omdsh-plugins/omdsh-sidepanel) | 右边一列文件树，下边一条终端，只在 Work 模式下出现。 |
| [omdsh-sidechat](https://github.com/omdsh-plugins/omdsh-sidechat) | 在任何位置召唤一条独立的对话，把你正看着的东西作为锚点带上。它从不碰你正在跑的那条对话。 |
| [omdsh-usage](https://github.com/omdsh-plugins/omdsh-usage) | 在会话顶栏显示本次会话花费、本项目花费与账户余额。 |
| [omdsh-status](https://github.com/omdsh-plugins/omdsh-status) | 在会话顶栏右端显示当前项目名称，以及 git 分支和变更计数。 |
| [omdsh-editor](https://github.com/omdsh-plugins/omdsh-editor) | 用你真正在用的编辑器、终端或文件管理器打开当前会话的目录。 |

### 模型能读到什么

DeepSeek 这条路只承载文字，别的都不行。这两个插件把人桌面上的其余东西也递给它——办法是在送到之前先变成文字。

| 包 | 它提供什么 |
|---|---|
| [omdsh-document](https://github.com/omdsh-plugins/omdsh-document) | 添加 Word、PPT、Excel、PDF 或任意文本文件——从这两个插件在加号菜单里立起的「附件」一栏中的**文档**、直接拖到窗口上，或者粘贴进输入框——宿主端会把它们的文字放到消息前面，输入框里不留任何标记。 |
| [omdsh-vision](https://github.com/omdsh-plugins/omdsh-vision) | 用你配置的视觉模型给它一双眼睛。从同一栏里的**多媒体**、拖到窗口上，或者直接粘贴，都能添加图片和视频；已经在磁盘上的，模型还能自己用 `see_image`、`ask_image` 和 `watch_video` 去看。 |

### 触达——别的机器

| 包 | 它提供什么 |
|---|---|
| [omdsh-remdev](https://github.com/omdsh-plugins/omdsh-remdev) | 把工作区接到一台 SSH 服务器上，在那边装好一个 `.dsh-server`，文件、终端和智能体都在那台机器上跑。 |
| [omdsh-remctrl](https://github.com/omdsh-plugins/omdsh-remctrl) | 独立端口上的第二扇前门，前面挡着设备配对和分级方法白名单，好让 tailnet 上的一部手机能看进度、能批准它要做的事。**Status: M0**——只有门和锁。 |

### 底座

| 包 | 它提供什么 |
|---|---|
| [omdsh-plughub](https://github.com/omdsh-plugins/omdsh-plughub) | 插件中心：设置里的一个页签，负责装上和卸掉这些插件，并用每个插件自己已经注册好的 settings schema 去配置它。 |
| [omdsh-shortcuts](https://github.com/omdsh-plugins/omdsh-shortcuts) | 为每个命令绑定一个快捷键，桌面菜单与网页端共用一份配置——一份文档，两个界面。它是这套约定的参考实现。 |

### 应用

| 仓库 | 它是什么 |
|---|---|
| [omdsh-desktop](https://github.com/omdsh-plugins/omdsh-desktop) | 一个 Electron 外壳，监督一个 harness 运行时，并在它周围补上原生的那一层——窗口、菜单、重启策略、启动画面。 |
| [omdsh-tui](https://github.com/omdsh-plugins/omdsh-tui) | harness 的交互式终端，以可安装的 profile bundle 形式发布。`omdsh-codemode` 在它那一列里跑的就是这个。 |
| [omdsh-webapp](https://github.com/omdsh-plugins/omdsh-webapp) | 一个打包器，把网页界面写成一个可双击的 macOS 应用：从 Dock 启动一个 profile，把已经显示着它的标签页调至前台，退出时停掉服务。 |

这几个各自带着自己的 pnpm workspace，所以它们都不是本 workspace 的成员。它们也都不往 profile 里组合任何图层，所以也都不出现在目录清单里。

**⬇️ 下载桌面版** —— 机器上不用再装别的，运行时和插件中心都在里面：
[**macOS**（Apple 芯片）](https://github.com/omdsh-plugins/omdsh-desktop/releases/download/v0.1.0-rc.6/DeepSeek-Harness-0.1.0-rc.6-arm64.dmg) · [**Windows**（64 位）](https://github.com/omdsh-plugins/omdsh-desktop/releases/download/v0.1.0-rc.6/DeepSeek-Harness-0.1.0-rc.6-x64-setup.exe) · [全部版本](https://github.com/omdsh-plugins/omdsh-desktop/releases/latest)

### 目录清单

| 目录 | 它是什么 |
|---|---|
| [registry/](https://github.com/omdsh-plugins/registry) | 一份由脚本生成的清单，列出这里的每一个插件，好让 `omdsh-plughub` 不必一次一个请求地去枚举一个 GitHub 账号。 |

## 它们怎么拼在一起

```
                    ┌──────────────── omdsh-plughub ────────────────┐
                    │        装上 · 卸掉 · 配置其余全部              │
                    └───────────────────────────────────────────────┘

  omdsh-basemode ──── 模式注册表、模式开关、侧栏圆点，以及 Work
      ├── omdsh-chatmode ── Chat · Work
      └── omdsh-codemode ── Code

  omdsh-shortcuts ── `shortcut` 服务；应用里每一个快捷键
  omdsh-remdev ───── `remdev` 服务；sidepanel 和 codemode 拿一个 cwd 来问它

  omdsh-sidepanel · omdsh-sidechat · omdsh-usage · omdsh-editor
  omdsh-status
      会话列旁边的那些界面，同伴没装时各自答得了自己
```

这里有三个服务是插件发布的，不是 harness 发布的：`sessionModes`（omdsh-basemode）、`shortcut`（omdsh-shortcuts）、`remdev`（omdsh-remdev）。它们在不在，是「某个人一条一条组出来的 profile」的属性，所以**没有任何插件会把另一个插件的服务写进顶层 `inject`**——它在 `apply` 里、在一条受限 fiber 上去够它，够不着就保持静默。少一个同伴，绝不能把整个页面带下去。这是[约定](CONVENTIONS.zh.md)的第 9 条，也是这套集合的任意子集都能组合起来的原因。

## 安装

你需要一个全局的 [`dsh`](https://github.com/deepseek-ai/deepseek-harness)、Node `^22.19.0 || >=24.0.0`，以及 pnpm 11.7.0。

### 从插件中心装

先装一次 `omdsh-plughub`，其余的都在设置里装：

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-plughub
dsh --profile web
```

打开**设置 → 插件 → 插件中心**，整套集合会列在那里，每张卡片上都有一个安装按钮。插件中心读的是 [registry](https://github.com/omdsh-plugins/registry) 清单，所以你装完中心之后才发布的插件，照样会出现。

每一次安装、更新、卸载都在下次启动时生效——卡片上会这么写，harness 的 loader 也不会热插拔一个 bundle。

### 从命令行装

插件中心带一条命令，目录里的东西都能按名字装：

```sh
npx @omdsh-plugins/omdsh-plughub list                       # 目录里有什么
npx @omdsh-plugins/omdsh-plughub add omdsh-basemode omdsh-chatmode omdsh-codemode
npx @omdsh-plugins/omdsh-plughub remove omdsh-codemode
```

这就是设置里那个页签的安装器，只是入口从按钮换成了 argv——同一份目录、同一个 specifier、底下同一个 `dsh plugin`——所以这样装上的插件，和从页签装上的是同一条依赖、同一行 bundle。不指定 `--profile` 时它写进 `web` profile，而那个 profile 得先存在：`dsh --profile web` 会建一个。

十二个里有十个是它存在的理由。它们不在 npm 上，所以 `dsh plugin --profile web add @omdsh-plugins/omdsh-chatmode` 会回 `ERR_PNPM_FETCH_404`，而且什么都不会改——profile 保持原样。能用的那条 git specifier 需要一条 pnpm 构建白名单，而那条记录里带着 pnpm 解析出来的 commit，只能从报错里抄、事先写不出来；这条命令替你写好。

`omdsh-basemode` 和 `omdsh-plughub` 在 npm 上，所以这两个也可以按老写法装：

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-basemode
```

顺序只是可读性上的偏好，不是要求：一个插件如果比它想要的服务先组合，它会在受限 fiber 上等，而不是失败。

**24 小时之内发布的版本，走 `dsh plugin` 按名字是装不到的。** 这是 pnpm 的谨慎，不是 npm 的，所以上面那条 `npx` 不受影响。pnpm 会把新发布的版本先晾一会儿——`minimumReleaseAge` 默认就是一天——所以发布第二天早上跑的 `add`，悄悄记下的是它*前面*那个版本，然后插件中心又会提示你更新到你本以为已经装上的那个。要么点名版本，要么就这一条命令把这个延迟豁免掉：

```sh
dsh plugin --profile web add @omdsh-plugins/omdsh-basemode@<version>
dsh plugin --profile web add @omdsh-plugins/omdsh-basemode --config.minimumReleaseAge=0
```

本 workspace 的 `pnpm-workspace.yaml` 里那句 `minimumReleaseAge: 0` 管不到那次安装：profile 目录自己就是一个 pnpm root，什么都不从这里继承。

卸掉也是同一条路：

```sh
dsh plugin --profile web remove @omdsh-plugins/omdsh-basemode
```

### 从本仓库装

这里大部分还没发布，而你正在改的那个插件，从来就不是已发布的那一份，所以在这里组的 profile 是从工作树装的。**先构建**——`dsh plugin add` 记的是 `link:` 依赖，装进去的文件*就是*这份 checkout，而一份没有 `lib/` 的 checkout 加载不了：

```sh
pnpm install
pnpm run build
dsh plugin --profile web add "$PWD/omdsh-basemode" "$PWD/omdsh-chatmode" "$PWD/omdsh-codemode"
```

`omdsh-tui` 不是本 workspace 的成员，它装进自己的 profile，而那正是 `omdsh-codemode` 去找它的地方：

```sh
cd omdsh-tui && pnpm install && pnpm run install:profile
```

**Code 模式需要这个 profile。** 没有它，按下 Code 会在终端那一列里显示 `dsh: profile "omdsh-tui" does not exist`，应用其余部分不受影响。

### 一个 profile 只能有一个界面层

一个 profile 在 `dsh-base` 之上只能组合**一个** surface bundle。`@deepseek-ai/dsh-web-app` 和 `@omdsh-plugins/omdsh-tui-app` 都是 surface，会在七个 loader id 上撞车，所以终端待在它自己的 profile（`omdsh-tui`）里，绝不和 `web` 放在一起。这套集合里的功能插件不是 surface，可以随意叠加。

## 配置

有东西要配的插件会注册**一个** settings 命名空间，带一份 [schemastery] schema，然后 `omdsh-plughub` 拿这份 schema 渲染出表单——标签、说明、校验、密钥脱敏、base/user 分层，全都是 harness 现成的。**没有任何插件需要教插件中心关于自己的事**，正是这一点让今天装上的插件在两种语言下都能拿到正确的标签，而中心一行都不用改。

有七个插件拥有自己的命名空间：`omdsh-plughub`、`omdsh-shortcuts`、`omdsh-remdev`、`omdsh-remctrl`、`omdsh-usage`、`omdsh-document`、`omdsh-vision`。其余的——在它们可配的范围内——是在 profile 自己的 `cordis.patch.yml` 里配的，每个 README 都会说清楚自己是哪一种。

存放凭据的字段会声明 `.role('secret')`，在每一次响应里被剥掉，并渲染成只写控件。

## 命令

在 workspace 根目录，对所有成员一起：

```sh
pnpm install
pnpm run build              # tsdown 打包每个插件的宿主半边和浏览器半边
pnpm run typecheck
pnpm run test
pnpm run check:harness-pin  # 确认没有插件还指着某份本地 harness checkout
pnpm run check:registry     # registry.json 与磁盘上的包一致
pnpm run registry:build     # 重新生成它
pnpm run check:docs         # 站点和这两份 README 仍然和注册表对得上
pnpm run profile:build      # 用这份 README 生成组织主页那一篇
pnpm run check:profile      # 它没有落在这份 README 后面
```

`omdsh-desktop`、`omdsh-tui` 和 `omdsh-webapp` 是独立的 workspace，它们的命令要进到各自目录里跑。

大多数插件另外还带着 `harness:local <path>` 和 `harness:npm`，用来在「旁边的一份 checkout」和「已提交的 registry 版本」之间切换 harness 依赖。只要还有东西是 link 状态，`check:harness-pin` 就会失败——`link:` 说明符把某一台机器的目录结构写死了，而且是**静默**失败，所以它绝不能进到提交里。

### 介绍这套集合的三份文档

同一套集合被介绍了三遍——`docs/` 下的站点、这两份 README，以及 [github.com/omdsh-plugins](https://github.com/omdsh-plugins)——而它们之间没有任何一份是由另一份渲染出来的。是这两条命令在拦着它们说出不一样的话。

`check:docs` 拿站点和两份 README 声称的东西——目录卡片、卡片上的版本与分类、各处的计数、下载链接、工具链版本、那九条规则——去对 `registry/registry.json` 和根 `package.json`，对不上就报出文件和行号。它不生成任何东西：站点讲的是 README 不讲的那套道理，生成会把两边都压平；它只是不许它们在别处已经写死的事实上互相矛盾。

它同时拿[README-STYLE.zh.md](README-STYLE.zh.md) 去要求这里的文档，而且那份契约是**从文档里读出来的**，不是在脚本里另抄一遍：语言切换那一行取自它讲第 3 行的那条规则里的代码块，中文章节的固定译名取自它那张对照表。一份被脚本转述过的风格文档，就变成了两份文档。真正被强制的是结构那一半——第 3 行、标题骨架、不许有许可证章节、不许跳级、已知限制必须收尾，以及两种语言的标题一一对应、顺序一致、代码块一致。句首大写那条故意不查：规则本身允许专有名词和被引用的界面字符串，查了会对正确的标题乱叫，而没人信的检查最后都会被关掉。它管得到的是本仓库这六份文档，再远就够不着了——风格真正说的那些插件 README，各自住在自己的仓库里。

组织主页那一篇是生成的，因为 GitHub 只从一个叫 `.github` 的仓库里读它，没有别的办法往那儿放东西——不生成的话，它就是一篇早已存在的介绍的第二份手抄。`profile:build` 把这份 README 在 **Commands** 处截断（往下都是写给已经克隆下来的人看的），把相对链接改写成绝对链接（它们会相对那个仓库解析），然后写进那个仓库的一份检出里：

```sh
git clone https://github.com/omdsh-plugins/.github.git org-profile
pnpm run profile:build
```

推送那份检出才会让页面变，所以改一次这份 README 是两次推送，和发一次版一样。页面落后时 `check:profile` 会失败。

CI 跑的就是这两条，也只跑这两条：其余每一条都要读插件的检出，而那些各自都是独立仓库，在这个仓库的克隆里根本不存在。

### 浏览器测试需要一份 harness checkout

在根目录跑 `pnpm run test`，**在一份新克隆上是不通过的**——这是设计如此，不是 bug：已发布的 harness 包只带 `lib/` 和 `.d.ts`，不带源码，而它的浏览器半边是一个等着 `window.__ModuleLoader__` 的 loader bundle，测试运行器根本没法 import。受影响的包把那些说明符 alias 到一个会抛错并告诉你怎么办的守卫模块上，这样只跑 node 的那些用例在两种模式下都能跑，只有真的去够 harness 的用例才会失败。

想跑全部，先把包指向一份 harness checkout：

```sh
cd omdsh-basemode && pnpm run harness:local ../../deepseek-harness && pnpm install
pnpm run test
pnpm run harness:npm && pnpm install     # 提交前切回来
```

因为 `pnpm -r` 在第一个失败的成员上就停，所以在 pin 状态下跑根目录的 `pnpm run test`，只会报出它最先走到的那个包的守卫，后面的根本不会跑。树处在 pin 状态时，请逐个包跑。

## 工具链上已知的粗糙处

- **`omdsh-codemode` 和 `omdsh-chatmode` 更适合在本 workspace 里构建。** 只有这两个包依赖了集合里的另一个包（`@omdsh-plugins/omdsh-basemode`）。从集合根目录走，`linkWorkspacePackages` 会把它解析到这份 checkout；但只要**进到**这两个目录里跑 `pnpm install`，pnpm 就会把它当成自己的 workspace 根，去 npm 上拉已发布的 `@omdsh-plugins/omdsh-basemode`——那是发布版，不是你正在改的这份 checkout。这也是为什么只有这两个插件没有自己的 `pnpm-lock.yaml`，以及为什么它们的命令应该从 workspace 根目录跑（`pnpm --filter @omdsh-plugins/omdsh-codemode run test`）。
- **`omdsh-remctrl` 和 `omdsh-remdev` 根本没有 `harness:local` / `harness:npm` / `check:harness-pin` 这几个脚本**，所以根目录那趟 `check:harness-pin` 是直接跳过它们的。它们今天都还没有浏览器用例，这是它至今没咬人的原因——但它们也确实不在那趟检查本该给出的保证之内。

## 写一个插件

[CONVENTIONS.zh.md](CONVENTIONS.zh.md) 是那份契约：九条规则、一份清单、一个实例。它短，是因为这些规则几乎全都是「用 harness 已经有的那道接缝」。[README-STYLE.zh.md](README-STYLE.zh.md) 是文档那一半——这里每一份 README 都同意长成什么样。

`omdsh-shortcuts` 是参考实现。读它的 `src/bindings.ts` 和 `src/index.ts` 末尾那段 settings 代码，是给另一个插件写出同样东西的最短路径。

## 已知限制

- **十二个里有十个还没上 npm。** `omdsh-basemode` 和 `omdsh-plughub` 已经发布，可以按名字装；本文里其余每一个 `@omdsh-plugins/…` 名字，交给 `dsh plugin add` 都会回 `ERR_PNPM_FETCH_404`。那十个通过插件中心装——它的命令或它的按钮，两者都从 registry 解析出来、装它的 GitHub 仓库——或者从 checkout 装；而插件中心会把 checkout 安装报成 `linked` 而不是「已是最新」，因为本来就没有什么可拉取的。
- **安装需要重启。** loader 在启动时组合一个 profile，这里没有任何东西能热插拔一个 bundle。
- **插件中心的写路由只走 loopback。** 一个对外提供的 `dsh web` 可以浏览目录，但不能从那里安装。
- **有些界面是借来的座位，不是自有的。** 模式开关把自己对准会话列上一个公开属性，侧栏圆点是画到 harness 自己的行上去的，还有两个插件是 portal 进 DOM 锚点的。底下的标记变了的时候，它们各自退化成「什么都不显示」，而不是「显示错的东西」——但每一个都是这套集合必须跟着走的选择器。
- **`omdsh-remctrl` 还在 M0**：端口、配对、白名单都在，桌面面板还没有。

[schemastery]: https://github.com/shigma/schemastery
