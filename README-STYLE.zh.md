# 本集合的 README 风格

[English](README-STYLE.md) | 中文

本仓库里每一份 README 都同意长成什么样，好让读过一份的人等于读过了全部。`omdsh-base/README.md` 是范本，这份文件是把那个范本写成规则。

## 骨架

一个插件仓库的 `README.md` 就是下面这些小节，按这个顺序：

```markdown
# omdsh-<name>

English | [中文](README.zh.md)

<一段导语：它是什么，并在其中链接 harness>

## What it adds

| Surface | Where it comes from |
|---|---|
| … | … |

<叙述小节——插件配得上几节就写几节，标题用句首大写>

## Install

## Commands

## Known limitations
```

`README.zh.md` 一节对一节地照着来，代码块相同，表格行相同、顺序相同。

## 规则

### 1. 标题是裸的包名

`# omdsh-shortcuts`。不是 `` # `@omdsh-plugins/omdsh-shortcuts` ``，不带 scope，不加反引号。标题是拿来读的，不是拿来敲的；scope 属于安装命令，那里才需要被复制。

`registry/` 是唯一的例外——它没有 npm 包名，所以保留它发布时用的仓库名：`# omdsh-plugins/registry`，不加反引号。

### 2. 第 3 行是语言切换，一个字节都不差

```markdown
English | [中文](README.zh.md)
```

中文文件里则是：

```markdown
[English](README.md) | 中文
```

不是单独一个 `[中文](README.zh.md)`，也不是 `[简体中文]`。两半永远都在，当前语言是那个**不是**链接的一半。

### 3. 导语里要链接 harness

第一段用一句话说清它是什么，并在第一次提到时链接 `[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)`。从搜索引擎过来的人，不用离开这一段就知道这是个给什么东西写的插件。

### 4. `## What it adds` 是一张表

```markdown
| Surface | Where it comes from |
|---|---|
| 模式开关 | `shell.overlay` 里的一个条目——ui-layout 那层横跨整个框架的浮层 |
```

左列：一个人看得见、或者调得到的东西。右列：它骑在哪道接缝上——一个槽位 id、一个服务、一条路由、一次接管。这张表就是「与 harness 的契约」写成清单的样子；清单说不清的，由它下面的散文来说。

中文里表头固定是 `| 界面 | 从哪来 |`，每一份文件都一样。

应用仓库（`omdsh-desktop`、`omdsh-tui`）不向 harness 贡献任何界面，所以在这个位置换成 `## Layout` 或 `## Packages`。`registry/` 描述的是一个文件，所以它的表是 `| Field | What it is |`。

### 5. 标题用句首大写

`## Known limitations`、`## The routes it holds`、`## New Session belongs to the mode it was pressed in`。只有第一个词和专有名词大写——被当作自身引用的界面文案也算专有（`New Session` 是一个按钮）。绝不写成 `## Known Limitations and Deferred Work`。

不许跳级：`##` 底下不能直接出现 `####`。

### 6. `## Install` 要写出包名，也要写出怎么卸

```markdown
## Install

​```sh
npx @omdsh-plugins/omdsh-plughub add omdsh-shortcuts
​```

或者从 checkout 装，这是还没发布的构建需要的形式：

​```sh
pnpm install && pnpm run build
dsh plugin --profile web add "$PWD"
​```

卸掉也是同一条路：

​```sh
dsh plugin --profile web remove @omdsh-plugins/omdsh-shortcuts
​```
```

**今天能用的那种形式排在最前。** 已经在 npm 上的插件，那就是它的 registry 名字，`dsh plugin --profile web add @omdsh-plugins/omdsh-base`；还没发布的，那就是插件中心自己那条命令——它通过 registry 解析名字，并把 git 安装需要的那条 pnpm 构建白名单写好。第一条命令就失败，比一条长一点但能用的命令更糟，而 `dsh plugin add` 碰上没发布的包只会回 `ERR_PNPM_FETCH_404`。checkout 形式两种情况下都跟在后面，给要自己构建的人。`add` 和 `remove` 永远用同一种方式称呼这个包，不管它是用哪种形式装上的。

这一节还要写清**关闭状态**——当这个插件会去够的某个同伴插件没被组合进来时，profile 会怎样（约定第 9 条），以及 `remove` 之后还剩下什么站着。那句话就该在这里，一个正在组 profile 的人正看着这里，而不是往上翻三十行去某个叙述小节里找。

`## Install` 排在叙述之后、`## Commands` 之前。读者先决定要不要这个插件，再被告知怎么拿到它。

### 7. `## Commands` 要列出每一个脚本

不叫 `## Development`。仓库定义的每一个 `pnpm run` 都要出现，包括 `harness:local`、`harness:npm` 和 `check:harness-pin`——约定第 8 条把那个开关列进了契约，而没有任何 README 提到的脚本，等于没有人会去跑。

```sh
pnpm install
pnpm run build        # tsdown 打包宿主半边和浏览器半边
pnpm run typecheck
pnpm run test
```

### 8. `## Known limitations` 排在最后，而且只写限制

不叫 `## Known limits`，不叫 `## What it does not do`，不叫 `## Known Limitations and Deferred Work`。它是一份列表，写「这个插件不做什么，而读者有理由以为它会做」——借来的锚点、不落盘的日志、拒绝支持的平台。路线图和对上游的期望不是限制，那些放进叙述里，或者干脆不写。

它后面不再有任何东西。收尾的细节小节——来历（`## Where this came from`），或者像 `## Two harness sources` 这样的开发旁注——放在 **`## Commands` 和 `## Known limitations` 之间**，这样「可操作」的那一对保持相邻，脚注也落在脚注该在的地方。因此这里每一份 README 的结尾只有两种形状：

```
## Install → ## Commands → ## Known limitations
## Install → ## Commands → ## Where this came from → ## Known limitations
```

### 9. 不要 `## License`

每个仓库都带 `LICENSE` 文件，每份 `package.json` 都带 `"license": "MIT"`，GitHub 两样都会渲染。README 里再复述一遍不增加任何信息，还会把 `## Known limitations` 从这个骨架专门留给它的末位挤掉。

### 10. 两种语言说的是同一件事

标题相同、顺序相同、代码块相同、表格行相同。shell 里的字面量保持字面——`<path-to-this-directory>` 要翻译，`dsh plugin add` 不翻译。当一种语言多出了另一种也该有的一句话时，把它补过去，而不是把它删掉。

固定的中文小节名，全集合通用：

| English | 中文 |
|---|---|
| What it adds | 它提供什么 |
| Install | 安装 |
| Commands | 命令 |
| Known limitations | 已知限制 |
| Layout / Packages | 目录结构 / 包 |
| Where this came from | 它从哪里来 |
