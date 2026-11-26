# Contributing to DevForge AI

Thanks for considering a contribution.

## Before you start

- Read the README and [architecture guide](docs/ARCHITECTURE.md).
- Search existing issues and pull requests before opening a duplicate.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md) rather than filing a public issue.
- Keep changes focused and avoid unrelated formatting churn.

## Development workflow

1. Fork the repository.
2. Create a branch from the default branch.
3. Install dependencies with `npm install`.
4. Configure only the environment variables and external services required for your change.
5. Implement the change with appropriate tests.
6. Run:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

7. Open a pull request with a clear problem statement, implementation summary, test output and any required configuration/migration notes.

## Contribution expectations

- Use TypeScript and the existing project conventions.
- Validate external input with Zod or the existing validation layer.
- Keep provider credentials and secrets server-side.
- Preserve project ownership checks and workspace path protections.
- Treat LLM output and external tool output as untrusted.
- Do not claim a tool, test, build or deployment succeeded unless it actually ran and returned verifiable evidence.
- Add regression tests for orchestration state, model routing, tool permissions, persistence and event-stream behavior when relevant.
- Avoid committing generated customer projects, private data, logs containing secrets, local execution state or `.env` files.
- Update docs when changing public configuration, commands, architecture or user workflows.

## Pull request checklist

- [ ] The change has a focused scope.
- [ ] Tests were added or updated.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] No credentials or private data are included.
- [ ] Security/ownership checks remain enforced.
- [ ] User-facing docs are updated where necessary.

## License and contributions

The repository owner must add and select a project license before contributions can be clearly accepted under a defined inbound contribution license. Until the repository has a license and contribution terms, do not assume that public visibility grants reuse rights. See the README license section.
