<!-- BEGIN:skill-invocation-rules -->
# 🧠 Mandatory: Skill Inspection & Invocation Before Execution

**EVERY TIME the user gives any command or request, you MUST:**
1. **Mandatory Skills to Always Invoke:**
   - **`using-superpowers`** (`.agents/skills/using-superpowers/SKILL.md`): Read and follow BEFORE taking any action or responding (including clarifying questions).
   - **`ponytail`** (`.agents/skills/ponytail/SKILL.md`): Read and follow to enforce YAGNI, minimal code, zero unrequested abstractions, and maximum efficiency.
2. **Task-Specific Skills:** Check all available skills in `.agents/skills/` (and global skills). If any match the task, read their `SKILL.md` using `view_file` BEFORE writing code or taking action.
3. Strictly follow all instructions defined in the matched skill(s).
<!-- END:skill-invocation-rules -->
