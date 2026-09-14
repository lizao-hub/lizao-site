import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  // 正文里的裸 HTML 一律转义。笔记不需要它，关掉就少一类风险。
  html: false,
  linkify: true,
  // 排版替换会把 -- 变成 en dash，全站禁用破折号，所以这里必须是 false
  typographer: false,
})

const rules = md.renderer.rules
const baseLinkOpen = rules.link_open

// 站外链接新开窗口，并补上 rel
rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = String(token?.attrGet('href') ?? '')
  if (/^https?:\/\//.test(href)) {
    token?.attrSet('target', '_blank')
    token?.attrSet('rel', 'noopener noreferrer')
  }
  return baseLinkOpen
    ? baseLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

export function renderNote(source: string): string {
  return md.render(source)
}
