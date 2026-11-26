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

DevForge AI is distributed under the Apache License, Version 2.0. By intentionally submitting a contribution for inclusion (for example, through a pull request), you agree that your contribution is submitted under the same Apache-2.0 terms, unless you clearly state otherwise in writing. This follows Section 5 of the license; it does not transfer ownership or copyright in your contribution to the project maintainer.

You must have the legal right to submit the contribution and must not include code, assets, documentation or other material that you do not have permission to contribute. Preserve applicable copyright, license, patent, attribution and NOTICE information. Identify substantial third-party material and its license in the pull request. Do not submit secrets or confidential material.

No separate Contributor License Agreement (CLA) or Developer Certificate of Origin (DCO) is currently required by this repository. The Apache-2.0 license does not grant permission to use DevForge AI's name or logo as a trademark. See the root [`LICENSE`](LICENSE) file for the complete license.
