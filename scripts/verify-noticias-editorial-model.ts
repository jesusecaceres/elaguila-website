import { assertNoticiasEditorialModelSmoke } from "../app/(site)/noticias/tests/noticiasEditorialModelSmoke";

const pass = assertNoticiasEditorialModelSmoke();
console.log(pass ? "PASS: noticias editorial model smoke" : "FAIL: noticias editorial model smoke");
process.exit(pass ? 0 : 1);
