import { assertRssSoccerQuerySmoke } from "../app/api/rss/tests/rssSoccerQuerySmoke";

const pass = assertRssSoccerQuerySmoke();
console.log(pass ? "PASS: noticias soccer query regression smoke" : "FAIL: noticias soccer query regression smoke");
process.exit(pass ? 0 : 1);
