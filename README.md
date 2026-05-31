<!--
╔══════════════════════════════════════════════════════════════════════╗
║  DreamSeed 种梦计划 — AI创造者大赛  官方 README 模板                ║
║                                                                      ║
║  使用说明：                                                          ║
║  1. 将本模板放在参赛仓库根目录 README.md 的顶部                       ║
║  2. 头图使用 DreamField 官方公开活动图片地址                         ║
║  3. 请保留 DREAMFIELD_README_HEADER_START / END 标识                 ║
║  4. 分割线以下供创作者自由编写项目内容                               ║
╚══════════════════════════════════════════════════════════════════════╝
-->

<!-- DREAMFIELD_README_HEADER_START -->

<p align="center">
  <a href="https://www.dreamfield.top">
    <img src="https://www.dreamfield.top/dream-field/contest-readme/assets/dreamseed-readme-banner.png" alt="DreamSeed 种梦计划参赛作品" width="100%" />
  </a>
</p>

<!-- DREAMFIELD_README_HEADER_END -->

# Oil-Price-Inquiry-Assistant
A WeChat mini program that provides oil price inquiry services for all provinces in China.
# ⛽ 全国油价查询

微信小程序，实时查询全国 31 个省/直辖市/自治区的汽油、柴油价格，支持自动定位、省份切换和油费估算。

## 功能特性

### 📊 当前油价

- 覆盖全国 **31 个省市**的实时油价数据
- 支持 **92# / 95# / 98# 汽油** 和 **0# 柴油**
- 显示与上次查询的价格涨跌对比
- 标注数据来源（实时 API 或本地缓存）

### ⏰ 调价倒计时

- 实时显示距离下次国家调价窗口的倒计时
- 内置 **2026 年官方调价日期表**（每 10 个工作日调整一次）

### 💹 油费估算

- 输入行驶里程和百公里油耗，自动计算出行花费
- 支持切换油品类型（0#柴油 / 92# / 95# / 98#汽油）

## 接口依赖

### 天行数据 API

- **油价接口**：`https://apis.tianapi.com/oilprice/index`
- **IP 定位接口**：`https://apis.tianapi.com/ipquery/index`
- 免费版每日调用限额：100 次

## 开发环境要求

- 微信开发者工具（建议最新稳定版）
- 开发调试时勾选「不校验合法域名」选项
- 真机测试需在微信公众平台配置合法域名：
  - `https://apis.tianapi.com`
  - `https://apis.map.qq.com`

## License

MIT
