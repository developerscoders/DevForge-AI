# Security Policy

## Reporting a vulnerability

Please do not publish exploitable vulnerability details in a public issue or pull request.

Use GitHub's private vulnerability reporting feature for this repository if it is enabled. Otherwise, contact the repository maintainers through a private channel listed on the GitHub organization profile. Include:
- affected version/commit;
- affected component and deployment mode;
- impact and realistic attack scenario;
- reproducible steps or a minimal proof of concept;
- any suggested mitigation.

Do not include real user data, API keys, OAuth tokens, service-account credentials or production database exports in a report.

## Security-sensitive areas

DevForge handles model prompts, generated code, filesystem operations, shell commands, user projects, cloud credentials and deployment integrations. Changes to these areas should be reviewed carefully.

Important controls include:
- Firebase ID-token verification and per-project ownership checks;
- server-side secret storage and redaction;
- workspace path normalization and traversal protection;
- command allowlisting, process timeouts and output limits;
- Zod validation and agent/tool permission checks;
- explicit approval for destructive or external operations;
- careful handling of model output, tool output and fetched web content.

## Supported versions

DevForge is under active development. Security fixes are applied to the current default branch; users should track current releases/commits and deploy updates after reviewing changes.

## Disclosure

Please coordinate disclosure with the maintainers and allow time for investigation and remediation before public disclosure.
