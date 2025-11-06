# Development Workflow

## Commit Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification with a **120-character limit** on commit headers.

### Format

```
type(scope): subject
```

- **type**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`
- **scope**: Optional - affected area (`auth`, `api`, `db`, etc.)
- **subject**: Short description (≤ 120 characters)

### Examples

```bash
feat(auth): add multi-factor authentication support
fix(api): resolve user validation error handling
chore(deps): update prisma to latest version
docs(readme): add deployment instructions
```

### Enforcement

- `commitlint` and `husky` automatically enforce standards
- Pre-commit hooks validate message format
- Use `yarn commit` for guided commit creation with Commitizen

## Code Quality Gates

### Pre-commit Validation

```bash
# Automatic via Husky hooks
- ESLint validation
- Prettier formatting
- TypeScript compilation
- Commit message validation
```

### Manual Quality Checks

```bash
# Run before pushing
yarn lint:fix          # Fix linting issues
yarn format            # Format code
yarn test              # Run unit tests
yarn test:e2e          # Run integration tests
```

## Development Modes

### Plan Mode vs Act Mode

When working with AI assistance:

- **Plan Mode**: Gather requirements, define approach, no code changes
- **Act Mode**: Execute approved plan and make actual changes
- Always start in Plan Mode unless explicitly requested otherwise
- Type `ACT` to move to Act Mode, `PLAN` to return to Plan Mode

## Branch Strategy

### Branch Naming

```bash
feat/feature-name       # New features
fix/bug-description     # Bug fixes
chore/task-description  # Maintenance tasks
docs/documentation-update # Documentation
```

### Development Flow

1. Create feature branch from `main`
2. Make changes following coding standards
3. Run quality checks locally
4. Create pull request with conventional title
5. Ensure CI passes before merge
