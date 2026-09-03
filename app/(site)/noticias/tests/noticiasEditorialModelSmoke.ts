import { isUsableArticleLink } from "../noticiasEditorialModel";

/**
 * N4 security regression guard: only absolute http(s) article links may ever become a clickable
 * href. Guards against a malformed/malicious RSS `link` value (javascript:, data:, vbscript:, a
 * bare non-URL string) ever being rendered as an outbound link.
 */
export function assertNoticiasEditorialModelSmoke(): boolean {
  const checks: boolean[] = [];

  checks.push(isUsableArticleLink("https://www.espn.com/soccer/story/_/id/1") === true);
  checks.push(isUsableArticleLink("http://example.com/article") === true);
  checks.push(isUsableArticleLink("  https://example.com/padded  ") === true);

  checks.push(isUsableArticleLink("javascript:alert(1)") === false);
  checks.push(isUsableArticleLink("data:text/html,<script>alert(1)</script>") === false);
  checks.push(isUsableArticleLink("vbscript:msgbox(1)") === false);
  checks.push(isUsableArticleLink("//evil.com/open-redirect") === false);
  checks.push(isUsableArticleLink("not a url") === false);
  checks.push(isUsableArticleLink("") === false);
  checks.push(isUsableArticleLink("   ") === false);
  checks.push(isUsableArticleLink(undefined) === false);
  checks.push(isUsableArticleLink(null) === false);
  checks.push(isUsableArticleLink(42) === false);

  return checks.every(Boolean);
}
