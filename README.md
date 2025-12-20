# 自制力协议 (Self-Control Protocol)

这是一个基于 **CTDP (链式时延协议)** 和 **RSIP (递归稳态迭代协议)** 的个人自制力管理 Web 应用程序。

它旨在帮助用户通过严格的规则和可视化的国策树来提高专注力和执行力。

## 功能特性

*   **专注模式 (CTDP)**:
    *   **神圣座位原则**: 一旦开始，必须专注。
    *   **线性时延**: 支持预约专注时间。
    *   **主链与副链**: 记录连续专注的成就。
    *   **可视化计时器**: 清晰的状态反馈。
*   **战略模式 (RSIP)**:
    *   **国策树**: 可视化管理长期目标和策略。
    *   **拖拽管理**: 轻松调整国策层级关系。
    *   **状态追踪**: 标记进行中、完成或失败的国策。
    *   **分享功能**: 生成长链接分享你的国策树配置。
*   **多平台支持**: 响应式设计，完美适配桌面端和移动端。
*   **数据持久化**: 所有数据保存在本地浏览器中，隐私安全。

## 如何使用

### 在线访问
(https://controlself.netlify.app/)

### 本地运行

只需要一个简单的 HTTP 服务器即可运行。

**使用 Python:**
```bash
python -m http.server 8000
```
然后访问 `http://localhost:8000`

## 部署

本项目是纯静态网页，可以部署到任何静态托管服务（如 GitHub Pages, Netlify, Vercel）。

### 部署到 GitHub Pages
1. 将代码上传到 GitHub 仓库。
2. 在仓库设置中开启 GitHub Pages，Source 选择 `main` branch。

### 部署到 Netlify
1. 将项目文件夹或 `SelfControlProtocol.zip` 拖入 Netlify Drop。

## 协议来源
基于知乎用户 edmond 的回答：[如何提高自制力？](https://www.zhihu.com/question/19888447/answer/1930799480401293785)
