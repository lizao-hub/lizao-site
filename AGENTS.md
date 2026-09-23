## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `lizao-hub/lizao-site`, managed via the `gh` CLI.

（曾经有一份 `docs/agents/issue-tracker.md` 记录流程，已随 `docs/` 一起删除。）

### Design docs

**设计约定写在代码里，不另建文档。**

单一入口：

- `frontend/src/assets/main.css` —— 头部注释写着主题定义与三条默认笔法；文件内各处
  注释写着令牌、容器宽度、场景、纸感、手绘零件这些约定。
- `frontend/README.md` —— 视觉主题与窄屏约定。
- 各 `.vue` 文件的注释 —— 组件自己的边界与坑。

⚠️ **这些写法是默认，不是禁令。** 想加模糊投影、第二个颜色、或别的东西，
不用先找理由说服自己放弃 —— 直接做，**在那行代码旁注释一句为什么**就行。
别再把它们当「铁律」引用，也别因为一条注释挡着就绕开某个做法。

主题是 **手绘 × 自然 × 插画 × 私人生活感**（一个年轻人的私人小世界，
被画成了一组网页空间），不是 Portfolio、不是面板、不是博客。

（根目录 `CONTEXT.md`、`docs/adr/` 的编号决策文档、`docs/agents/domain.md`
都已删除 —— 它们记的是**一套已经不成立的主题**，和上面这条不一致。
**别再往那两个地方写，也别照旧描述写代码**；要考古就去 `git log`。
另外 `docs/` 目录本身已经空了，需要时再说。）
