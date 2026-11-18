# Nexora Development Environment Audit (Phase 0 Baseline)

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Empirical tool, runtime, Docker, port, and GitHub CLI verification on the workstation prior to Phase 1 setup.

---

## Verified Local Tooling & Versions

| Component                      | Command Executed                                                 | Observed Output / Version                                                                 | Status                     |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------- |
| **Operating System**           | Workspace Environment                                            | Windows (`D:\Nexora`)                                                                     | `Verified`                 |
| **Node.js**                    | `node -v`                                                        | `v22.23.4` (LTS)                                                                          | `PASS`                     |
| **npm**                        | `npm -v`                                                         | `10.9.9`                                                                                  | `PASS`                     |
| **Git**                        | `git --version`                                                  | `git version 2.56.0.windows.4`                                                            | `PASS`                     |
| **Git Identity**               | `git config --global user.name` / `user.email`                   | Configured globally (`Ntrungz07` / `ntrungz0704@gmail.com`)                               | `PASS`                     |
| **Docker Engine**              | `docker --version` & `docker info --format '{{.ServerVersion}}'` | `Docker version 29.9.2, build a82e528` (Daemon Running)                                   | `PASS`                     |
| **Docker Compose**             | `docker compose version`                                         | `Docker Compose version v5.6.1`                                                           | `PASS`                     |
| **GitHub CLI (`gh`)**          | `gh --version` & `gh auth status`                                | `gh version 2.103.3`; logged in as `ntrungz0704` (`scopes: 'gist', 'read:org', 'repo'`)   | `PASS`                     |
| **Target Ports**               | `netstat -ano \| findstr ...`                                    | Ports `3306`, `3307`, `5173`, `3000` free (no conflict)                                   | `PASS`                     |
| **Local `mysql` CLI**          | `mysql --version`                                                | Not installed natively on Windows PATH (managed via Docker `mysql:8.4` container instead) | `Expected / Containerized` |
| **Existing GitHub Repo Check** | `gh repo view ntrungz0704/Nexora`                                | Not found (`exit 1`) — safe to create fresh Private repo `Nexora`                         | `PASS`                     |
