<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-guidelines -->
# 📘 Mandatory: Read Project Guidelines

**BEFORE writing any code, you MUST read `GUIDELINE.md` in the project root.**

This file contains:
- Project architecture & folder structure conventions
- Coding standards (TypeScript, React, Tailwind CSS v4)
- Environment variable rules (`.env`, `.env.development`, `.env.production`)
- PWA (Serwist) configuration guidelines
- SEO & performance requirements
- Git conventions
- Dos and Don't for AI agents

Failure to follow these guidelines will result in inconsistent, non-maintainable code.
<!-- END:project-guidelines -->

<!-- BEGIN:skill-invocation-rules -->
# 🧠 Mandatory: Skill Inspection & Invocation Before Execution

**EVERY TIME the user gives any command or request, you MUST:**
1. **Mandatory Skills to Always Invoke:**
   - **`using-superpowers`** (`.agents/skills/using-superpowers/SKILL.md`): Read and follow BEFORE taking any action or responding (including clarifying questions).
   - **`ponytail`** (`.agents/skills/ponytail/SKILL.md`): Read and follow to enforce YAGNI, minimal code, zero unrequested abstractions, and maximum efficiency.
2. **Task-Specific Skills:** Check all available skills in `.agents/skills/` (and global skills). If any match the task, read their `SKILL.md` using `view_file` BEFORE writing code or taking action.
3. Strictly follow all instructions defined in the matched skill(s).
<!-- END:skill-invocation-rules -->

