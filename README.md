# AI Engineering Lab · 个人技术学习网站

> 让知识长成可以运行的系统。

这是面向 AI 工程、LLM、Agent/Harness、RAG、训练与推理的个人数字花园 V1.1。风格融合极简博客、技术产品主页与轻量交互式学习工作台。纯前端静态网站，**基础知识库不依赖后端、数据库或 Node.js**，可离线运行；新增的 AI 前沿情报需要联网，或读取预先生成的数据快照。

## 立即启动

### 最简单：直接打开

双击 `index.html`，即可在浏览器中访问。也可以直接使用发行包中的 `AI-Engineering-Lab-单文件预览.html`，其中已经嵌入 CSS、JavaScript 和示例内容。

### 推荐：本地静态服务

需要 Python 3：

```bash
cd AI-Engineering-Lab
python -m http.server 8000
```

然后访问 `http://localhost:8000`。Windows 用户可以尝试双击 `start-windows.bat`。

## 站点功能

- **从这里开始**：模型原理、RAG / Agent、可靠工程三条阅读主线，每条附建议产出。
- **6 篇资料学习指南**：Attention 维度与遮罩、KV Cache 预算、RAG 评测、Agent 停止条件、异步取消、论文到代码；均附原始资料和建议实验。与原有 12 篇示例笔记分别标注，不把建议任务当作实测成果。
- **精选学习书架**：10 份博主、文档、论文与教学代码资源，支持按类型筛选，注明阅读目的与练习。
- **阅读体验**：文章目录可跳转并支持键盘焦点，提供相关阅读与可分享的文章链接。
- **KV Cache 小实验**：拖动上下文长度观察固定配置的理论缓存大小，明确排除权重、激活与分配开销。

- 响应式首页：个人定位、AI Engineering Lab 品牌和 Agent/Harness 示意架构。
- **AI 前沿情报**：技术社区动态、Hugging Face 新模型 / Daily Papers、GitHub Releases，分类 / 搜索 / 技术方向过滤；按公开来源获取信息。
- **关注关键词**：自定义 Qwen、DeepSeek、Agent、vLLM、RAG 等关键词，一键筛选相关动态。
- **收藏与导出**：收藏新闻 / 模型 / 论文 / 发布信息，并导出 Markdown。
- **每 15 分钟尝试更新**：浏览器前台刷新，失败会显示连接失败、缓存或定时快照状态。
- **9 个知识主题**：软件工程、深度学习、LLM、RAG、Agent/Harness、评测安全、多模态、推理工程、源码研究。
- **12 篇示例技术笔记**：文章分类、站内搜索、正文阅读和文章分享链接。
- **4 个研究项目**：Harness、AI Gateway、Agentic RAG、模型训练与推理。
- **12 项成长路线**：在当前浏览器保存勾选状态和进度。
- **灵感速记**：自动保存到浏览器 localStorage，支持导出 Markdown。
- 深浅主题切换、手机导航、阅读进度、键盘快捷键：Ctrl/Cmd+K 搜索。

## 编辑内容

重点编辑 `data.js`：

```js
window.LAB_DATA = {
  profile: { name: '你的名字', headline: '...', introduction: '...' },
  categories: [ /* 九大知识类目 */ ],
  notes: [
    {
      slug: 'unique-article-id', // 唯一标识，不能重复
      category: 'Agent',          // 与筛选分类保持一致
      title: '新文章标题',
      desc: '50 字以内内容摘要',
      read: 8,                   // 预计阅读分钟
      date: '2026-10-23',
      body: `## 背景

在这里写 Markdown 正文。`
    }
  ],
  projects: [ /* 工程和实验 */ ],
  roadmap: [ /* 学习路线 */ ]
};
```

笔记正文支持 `##/###` 标题、列表、加粗、行内代码、代码块、外链和引用。该版本使用轻量 Markdown 解析器，**不是完整的 Markdown/MDX 引擎**。如要发展成长期内容库，建议下一阶段迁移到 Astro Content Collections + Markdown/MDX。

- 更新结构和模块：`index.html`
- 更新视觉与布局：`styles.css`
- 更新站内交互：`app.js`
- 浏览器本地数据：`lab-roadmap-v1`、`lab-capture-v1`、`lab-theme`、`ai-lab-frontier-v3`、`ai-lab-frontier-saved-v1`、`ai-lab-frontier-watch-v1`

## 发布上线

### Cloudflare Pages / Netlify

将源码目录中的站点文件一起上传（特别是 `radar.css` 和 `radar.js`）；不需要构建。若希望自动生成前沿快照，可在 CI 中定时执行 `python scripts/update_frontier.py`，并将生成的 `frontier-feed.json` 一起发布。

### GitHub Pages（推荐：自动联网数据 + 自动部署）

本版本已修复「定时任务提交文件后，Pages 没有同步重建」的问题：同一个 GitHub Actions 工作流负责 **抓取 → 保存公开快照 → 直接部署 Pages**，并且第一次生成 `frontier-feed.json` 时也能正常提交。

1. 在 GitHub 建立公开仓库（例如 `ai-engineering-lab`），将 `AI-Engineering-Lab/` **里面的所有文件和 `.github/workflows/` 隐藏目录**上传至仓库**根目录**。不要将 `AI-Engineering-Lab/` 整个父目录作为一个子文件夹上传到根目录。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，设置为 **GitHub Actions**（不是 `Deploy from a branch`）。
3. 在 **Settings → Actions → General → Workflow permissions** 中确认工作流有读取和写入仓库内容的权限；本仓库的 workflow 已显式声明 `contents: write`、`pages: write`、`id-token: write`，如组织策略禁止写入，需要管理员放开。
4. 仓库 **Actions → Refresh and deploy AI frontier → Run workflow**，手动运行首次更新，查看 `Fetch AI public data` 和 `Deploy GitHub Pages` 两步是否成功。
5. 在仓库 **Settings → Pages** 中打开生成的网站地址（通常是 `https://<用户名>.github.io/<仓库名>/`），点击首页的 **AI 前沿**。
6. 计划任务每约 4 小时尝试执行；GitHub Actions 定时计划可能延迟或被跳过。页面本身在浏览器可访问公开接口时，也会约每 15 分钟尝试更新。

**为什么不能只提交 JSON 就算完成？** GitHub 文档说明，使用 `GITHUB_TOKEN` 推送的提交不触发 Pages 的分支构建。因此现在 workflow 在同一次运行中直接调用 `actions/deploy-pages`，保证成功运行的那次抓取会有一次相应的站点部署。

**验证方式**：查看 GitHub Actions 日志，确认 `news / models / papers / opensource` 的抓取数量；确认 Pages 站点的 `frontier-feed.json` 是能打开的 JSON，且 `generatedAt` 时间在合理范围。四个数据源可能独立失败，失败来源显示为失败或旧数据，不伪装为实时数据。

本地也可以执行：

```bash
python scripts/update_frontier.py
python -m http.server 8000
```

定时脚本只依赖 Python 标准库，无需 API Key；所有数据取自公开接口。用户浏览器若因 CORS、访问限制或接口异常无法获取某个数据源，可以读取站点里的最近快照。请勿将 GitHub Token、私有模型仓库凭据嵌入前端。

**发布目录必须包含**：`index.html`、`styles.css`、`radar.css`、`data.js`、`app.js`、`radar.js`、`favicon.svg`、（生成后）`frontier-feed.json`；快照 workflow 和 Python 脚本仅用于维护，不需要由网页执行。

这些服务的具体 UI 可能随着版本变化，按官方文档操作即可。

## AI 前沿来源与更新机制

| 频道 | 实际来源 | 技术意义 | 注意 |
| --- | --- | --- | --- |
| AI 新闻 | Hacker News Algolia Search | 社区 AI 技术讨论 | 不是核实后的官方新闻 |
| 模型上新 | Hugging Face Hub API | 模型仓库创建记录 | 仓库创建时间不等于官方发布时间 |
| 算法论文 | Hugging Face Daily Papers API | 日常论文推荐 | 不保证覆盖所有最新论文 |
| 开源更新 | GitHub Releases API | vLLM、SGLang、Transformers 等项目的发布 | 仅展示维护者创建的 Release，可能缺少标签或提交 |

- 页面前台约每 15 分钟尝试从公开接口更新；仅在页面打开且未隐藏时执行，**不等于后台持续刷新**。
- 可选的 GitHub Actions 工作流约每 4 小时生成一次 `frontier-feed.json`；其执行计划不保证精确准点。
- 时间状态明确区分「已同步」「定时快照」「本地缓存」「旧快照」「连接失败」。遇到网络不可用时不会生成虚假的最新消息。
- 直接双击 `index.html` 打开，或打开单文件 HTML 时，浏览器对 `file://` 的跨域网络访问限制可能导致数据源不可用。**建议通过 `http://localhost:8000` 或正式静态站点查看实时数据**。
- 首页与技术笔记是静态示例内容；**AI 前沿数据源读取到的外部记录不经过人工事实核验**，重要信息请通过来源链接确认。
- `preview-frontier-*.png` 是**以测试模拟数据**生成的界面截图，并不是对 2026 年实际新闻内容的确认。

## 重要边界

1. **内容标注**：内置文章是为演示而撰写的技术专题草稿，不应被当作已经发表的个人文章、论文或真实测量报告。请逐步替换为自己的笔记、代码、实测和参考文献。
2. **保密**：公开站点不应包含公司/客户内部数据、真实接口密钥、未授权项目细节和运维凭证。
3. **学习进度与速记只在本浏览器保存**，换电脑/清理缓存就可能丢失；速记请及时导出，不要写密码或敏感数据。
4. **不是 CMS**：访客不能直接在线改写公开文章；更新文章需要编辑 `data.js` 再发布。
5. 静态站点不会自动获得用户账户、远程同步或 AI 助手功能，这些可放到下一阶段。

## 下一阶段扩展方向

- 用 Astro + MDX 管理文章，增加静态搜索、RSS、Sitemap、SEO、目录导航和代码高亮。
- 用 GitHub Actions 实现内容提交后自动部署。
- 增加交互实验（Attention、KV Cache、RRF、异步并发的动态可视化）。
- 增加完整的源码研究模板、论文阅读索引、实验记录规范。
- 在需要跨设备同步时，引入鉴权和受权限保护的数据后端，而不是直接暴露私有笔记。

## 设计研究参考

- [Lee Robinson](https://leerob.com/) — 简洁的个人品牌和文章索引。
- [Anthony Fu](https://antfu.me/) — 开源开发者风格和长期项目陈列。
- [Josh Comeau](https://www.joshwcomeau.com/) — 教学与交互型内容设计。
- [Lilian Weng](https://lilianweng.github.io/) — 深度 AI 技术研究文章结构。
- [Jay Alammar](https://jalammar.github.io/) — 图解与可视化教学。

本站 HTML、CSS 和 JS 为独立实现，没有复制上述网站的视觉资源与源码。

## Windows 一键公网发布（Codex / PowerShell）

已提供 `deploy-windows.ps1`。首次使用只需：

1. 安装 Git 和 GitHub CLI（在 PowerShell 中分别执行 `winget install --id Git.Git -e` 和 `winget install --id GitHub.cli -e`）。
2. 重新打开 PowerShell，进入本网站的解压目录，运行：

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy-windows.ps1
   ```

3. 如果尚未登录 GitHub，脚本会启动 `gh auth login --web` 登录流程。
4. 脚本会要求输入 `PUBLIC`，确认你理解这是一个**公开**的网站与源代码仓库。
5. 脚本使用**全新仓库** `ai-engineering-lab`，不会覆写任何现有仓库；创建后自动上传指定的公开网站文件、尝试开启 Pages GitHub Actions 源、触发数据抓取与发布。
6. 前往输出的 Actions 页面确认部署成功，随后打开脚本输出的站点地址。

如果 GitHub Pages API 不允许自动开启，脚本会指出唯一的手动操作：进入仓库 Settings → Pages，把 Source 设为 `GitHub Actions`，然后在 Actions 页面重新运行 `Refresh and deploy AI frontier`。

> 可以把以上步骤交给本机 Codex 执行；**不要让 Codex 索要或打印 GitHub Token**。使用 `gh auth login --web` 进行用户授权，敏感凭据只留在本机登录状态中。


Codex 一键部署任务文本另见：[`CODEX_部署任务.md`](CODEX_部署任务.md)。
