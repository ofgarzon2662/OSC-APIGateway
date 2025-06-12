# Submission Listener

[![Test Coverage](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/your-repo)
[![Tests](https://github.com/your-org/your-repo/workflows/Test%20Submission%20Listener/badge.svg)](https://github.com/your-org/your-repo/actions)

## Testing

### Run Tests Locally

```bash
# Install dependencies
make install

# Run tests with coverage
make test-cov

# Generate HTML coverage report
make test-html

# Clean up coverage files
make clean
```

### Coverage Requirements

- Minimum coverage: **75%**
- Tests will fail if coverage drops below this threshold
- Coverage reports are generated in `htmlcov/` directory

### CI/CD

Tests run automatically on:
- Push to any branch
- Pull requests
- Coverage must meet 75% threshold for CI to pass 