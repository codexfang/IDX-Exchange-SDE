# Pull Request

## Summary

<!-- What does this change do, and why is it needed? -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change that neither fixes a bug nor adds a feature
- [ ] `test` — tests only
- [ ] `docs` — documentation only
- [ ] `chore` — tooling, dependencies, configuration

## Related issue

<!-- e.g. Closes #42, or "Part of Week 10: Git Workflow & Code Organization" -->

## Changes

<!-- Bullet the notable changes so a reviewer knows where to look. -->

-
-

## How to test

<!-- Exact commands and what to expect. -->

```bash
cd backend && npm test
cd frontend && npm test -- --watchAll=false
cd frontend && npm run lint
```

- [ ] Change is covered by automated tests, or a note explains why not
- [ ] `npm run lint` passes with no errors or warnings

## Screenshots

<!-- For UI changes: before and after. Delete this section if not applicable. -->

## Checklist

- [ ] Branch is based on `develop` and targets `develop`
- [ ] Commit messages follow the conventional format (`type(scope): description`)
- [ ] No `console.log`, commented-out code, or unused imports were added
- [ ] No secrets, `.env` files, or database dumps are included
- [ ] Documentation updated if the API, database schema, or setup steps changed

## Reviewer notes

<!-- Anything you are unsure about, plus a walkthrough of the files you changed. -->
