# AGENTS.md instructions for /Users/truck/Desktop/github/nilnoop/ezviz-camera

遇到不确定的问题，永远不要猜测，而是询问用户或是补充调试日志。一次随意猜测可能导致线上故障进而导致大额资产损失，这是不可接受的。

从接口或其他模块传递参数的时候，需要明确含义，只读一个字段，避免读一堆字段进行兼容。这会导致不易察觉的 Bug。

## HeroUI v3

本项目使用 HeroUI v3。官方文档索引入口是：

- https://heroui.com/react/llms.txt

编写或修改 HeroUI 组件时，必须先打开对应组件的具体文档页面核对细则，不能只看通用索引，也不能凭记忆写 API。重点核对：

- `import` 写法
- 组件组合方式，例如 `Card.Header`、`Table.Content`、`Pagination.Link`
- props 名称、枚举值、默认值
- 是否存在 v2 到 v3 的 API 差异
- 官方 CSS class / BEM class 的语义和可覆盖方式

如果具体组件文档和本地 `@heroui/react` / `@heroui/styles` 类型定义不一致，必须停下来核对当前安装版本和源码类型，不要猜测，也不要混用 v2 API。

