/** 2026.08.14，等宽字体下的目录式日期 */
export function shortDate(iso: string): string {
  return iso.split('-').join('.')
}

/** 2026 年 8 月 14 日 */
export function longDate(iso: string): string {
  const [year = '', month = '1', day = '1'] = iso.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
