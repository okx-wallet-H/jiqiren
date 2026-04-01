# jiqiren

本仓库包含 Telegram Bot 与 Mini App 网格仪表盘两部分代码，用于配合 OKX 网格策略交互与页面展示。

| 目录 | 说明 |
| --- | --- |
| 根目录 | Bot 代码与运行所需文件，例如 `index.js`、`package.json`、`assets/`、`.env.example`。 |
| `webapp/` | Mini App 网格仪表盘的静态构建产物，可直接部署到 Nginx 等静态服务器。 |
| `react8_extracted/` | Mini App 的 React 源码目录，用于二次开发与重新构建。 |
| `docs/` | 现有静态站点目录，可用于 GitHub Pages 或历史构建输出。 |

部署 Mini App 时，可将 `webapp/` 目录发布到 Web 服务器，再把 Bot 菜单按钮地址配置为对应的 HTTPS 页面地址。
