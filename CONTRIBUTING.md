# Contributing to Cluv

Thank you for your interest in contributing to Cluv! We welcome contributions from the community and are pleased to have you join us.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please treat everyone with respect and create a welcoming environment for all contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your contribution
5. Make your changes
6. Test your changes
7. Submit a pull request

## Development Setup

### Prerequisites

- Rust 1.70 or later
- FFmpeg and FFprobe installed on your system
- Git

### Setting up the development environment

```bash
# Clone your fork
git clone https://github.com/fxkt-tech/cluv.git
cd cluv

# Install dependencies
cargo build

# Run tests to ensure everything works
cargo test

# Run the example CLI
cargo run -- --help
```

### Installing FFmpeg

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
Download from [FFmpeg official website](https://ffmpeg.org/download.html) or use chocolatey:
```bash
choco install ffmpeg
```

## How to Contribute

### Types of Contributions

- **Bug fixes**: Fix issues in the existing codebase
- **New features**: Add new functionality to the library
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Examples**: Create new examples or improve existing ones
- **Performance**: Optimize existing code

### Before Starting Work

1. Check the [issues](https://github.com/fxkt-tech/cluv/issues) to see if someone is already working on it
2. For major changes, create an issue first to discuss the approach
3. For bug fixes, create an issue with reproduction steps

## Pull Request Process

1. **Create a branch**: Use a descriptive name like `feature/add-watermark-support` or `fix/audio-encoding-bug`

2. **Make your changes**:
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   # Run all tests
   cargo test

   # Check formatting
   cargo fmt --check

   # Run clippy for lints
   cargo clippy -- -D warnings

   # Build the project
   cargo build --release
   ```

4. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Follow the [Conventional Commits](https://www.conventionalcommits.org/) format when possible
   - Examples:
     - `feat: add watermark support for video transcoding`
     - `fix: resolve audio sync issues in MP4 output`
     - `docs: update README with HLS examples`

5. **Push to your fork** and create a pull request

6. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers
   - Testing instructions
   - Any breaking changes

## Coding Standards

### Rust Style Guidelines

- Follow standard Rust formatting (`cargo fmt`)
- Use `cargo clippy` and fix all warnings
- Write idiomatic Rust code
- Use meaningful variable and function names
- Add documentation comments (`///`) for public APIs

### Code Organization

- Keep modules focused and cohesive
- Use appropriate visibility modifiers
- Group related functionality together
- Separate concerns appropriately

### Error Handling

- Use the custom `CluvError` type for all errors
- Provide meaningful error messages
- Use `Result<T>` for fallible operations
- Don't panic in library code

### Documentation

- Document all public APIs
- Include examples in documentation
- Keep README up to date
- Add inline comments for complex logic

## Testing

### Writing Tests

- Write unit tests for individual functions
- Write integration tests for complete workflows
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies when appropriate

### Running Tests

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run tests for specific module
cargo test ffmpeg::

# Run doctests
cargo test --doc
```

### Test Coverage

- Aim for high test coverage on new code
- Test edge cases and error conditions
- Include tests for examples and documentation

## Documentation

### Types of Documentation

- **API Documentation**: Rustdoc comments on public APIs
- **README**: Getting started, examples, basic usage
- **Examples**: Complete, runnable examples
- **Guides**: Detailed tutorials for complex scenarios

### Writing Good Documentation

- Use clear, concise language
- Include code examples
- Explain the "why" not just the "what"
- Keep examples up to date
- Test all code examples

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- Rust version (`rustc --version`)
- FFmpeg version (`ffmpeg -version`)
- Operating system
- Minimal reproduction case
- Expected vs actual behavior
- Complete error messages
- Stack traces when available

### Feature Requests

For feature requests, please include:

- Use case description
- Proposed API design (if applicable)
- Examples of similar functionality in other libraries
- Willingness to implement the feature

### Security Issues

For security-related issues, please email the maintainers directly instead of creating a public issue.

## Development Workflow

### Branching Strategy

- `main`: Stable, production-ready code
- `develop`: Integration branch for new features
- `feature/*`: New features and enhancements
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Release Process

1. Features are merged to `develop`
2. Release candidates are created from `develop`
3. After testing, `develop` is merged to `main`
4. Tags are created for releases
5. Crates.io publication follows semantic versioning

## Getting Help

- Check existing [issues](https://github.com/fxkt-tech/cluv/issues)
- Look at [examples](https://github.com/fxkt-tech/cluv/tree/main/examples)
- Read the [documentation](https://docs.rs/cluv)
- Ask questions in [discussions](https://github.com/fxkt-tech/cluv/discussions)

## Recognition

Contributors will be recognized in:

- The project's `CONTRIBUTORS.md` file
- Release notes for significant contributions
- The project's documentation

## License

By contributing to Cluv, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Cluv! 🎉
