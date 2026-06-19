# Virtual Environment Setup Guide

This guide explains how to use the cross-platform virtual environment setup included in the Makefile.

## Overview

The `Makefile` is configured to automatically detect your operating system and create a platform-specific virtual environment for the Document Ingestion Pipeline.

**Supported Platforms:**
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ✅ macOS (Intel and Apple Silicon)
- ✅ Windows (PowerShell, Command Prompt)

## Quick Start

### macOS / Linux

```bash
# Step 1: Create virtual environment and install dependencies
make install

# Step 2: Activate the virtual environment
source venv/bin/activate

# Step 3: Run the development server
make dev
```

### Windows (PowerShell)

```powershell
# Step 1: Create virtual environment and install dependencies
make install

# Step 2: Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Step 3: Run the development server
make dev
```

### Windows (Command Prompt)

```cmd
REM Step 1: Create virtual environment and install dependencies
make install

REM Step 2: Activate the virtual environment
venv\Scripts\activate.bat

REM Step 3: Run the development server
make dev
```

## Makefile Variables

The Makefile automatically sets these variables based on your OS:

| Variable | Purpose | Unix Value | Windows Value |
|----------|---------|-----------|---------------|
| `VENV_DIR` | Virtual environment directory | `venv` | `venv` |
| `PYTHON` | Python interpreter | `python3` | `python` |
| `PYTHON_VENV` | Python inside venv | `venv/bin/python` | `venv\Scripts\python.exe` |
| `PIP_VENV` | Pip inside venv | `venv/bin/pip` | `venv\Scripts\pip.exe` |

## Available Commands

### Setup Commands

```bash
# Create a fresh virtual environment
make venv

# Create venv and install dependencies (recommended)
make install
```

### Runtime Commands

```bash
# Run production server
make run

# Run development server (auto-reload on file changes)
make dev
```

### Testing & Linting

```bash
# Run tests
make test

# Run code linters and formatters
make lint

# Show help
make help
```

### Utilities

```bash
# Show pipeline statistics
make ingestion-stats

# Test single document ingestion
make ingest-sample

# Clean up database and cache
make clean
```

## How It Works

### 1. Virtual Environment Detection

The Makefile uses Makefile's built-in variables to detect the OS:

```makefile
UNAME_S := $(shell uname -s)
ifeq ($(OS),Windows_NT)
    # Windows-specific settings
else ifeq ($(UNAME_S),Darwin)
    # macOS-specific settings
else
    # Linux-specific settings
endif
```

### 2. Automatic Python Path Resolution

All commands use `$(PYTHON_VENV)` which resolves to:
- **Unix**: `venv/bin/python`
- **Windows**: `venv\Scripts\python.exe`

### 3. Module Execution

Instead of calling executables directly, commands use Python's `-m` flag:

```bash
$(PYTHON_VENV) -m uvicorn src.app:app
$(PYTHON_VENV) -m pytest tests/
$(PYTHON_VENV) -m pip install -r requirements.txt
```

This approach is more cross-platform and reliable than relying on PATH.

## Directory Structure

After running `make install`, your project structure will include:

```
DocumentIngestionPipeline/
├── venv/                          # Virtual environment
│   ├── bin/                       # Unix executables
│   │   ├── python
│   │   ├── pip
│   │   ├── pytest
│   │   └── uvicorn
│   ├── Scripts/                   # Windows executables (if on Windows)
│   │   ├── python.exe
│   │   ├── pip.exe
│   │   ├── pytest.exe
│   │   └── uvicorn.exe
│   └── lib/                       # Python packages
├── src/
├── tests/
├── requirements.txt
├── Makefile
└── ...
```

## Common Issues

### Issue: "make: command not found"

**Solution**: Make sure you have `make` installed:
- **Ubuntu/Debian**: `sudo apt-get install build-essential`
- **macOS**: `xcode-select --install`
- **Windows**: Use Windows Subsystem for Linux (WSL) or install Make via Chocolatey: `choco install make`

### Issue: "python: command not found"

**Solution**: The Makefile uses `python3` by default. If you only have `python`:
- Edit the Makefile and change `PYTHON := python3` to `PYTHON := python`

### Issue: Permission denied when activating venv (Unix)

**Solution**: Make the activation script executable:
```bash
chmod +x venv/bin/activate
```

### Issue: Virtual environment already exists

**Solution**: Clean it up and recreate:
```bash
rm -rf venv
make install
```

## Deactivating Virtual Environment

When you're done, deactivate the virtual environment:

```bash
# All platforms
deactivate
```

## Managing Dependencies

### Adding New Packages

```bash
# Activate venv first
source venv/bin/activate  # Unix
# or
venv\Scripts\activate     # Windows

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

### Updating requirements.txt

```bash
# With venv activated
pip install -r requirements.txt --upgrade
pip freeze > requirements.txt
```

## CI/CD Integration

The venv-based Makefile works great in CI/CD pipelines:

```yaml
# GitHub Actions example
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Setup and test
        run: |
          cd DocumentIngestionPipeline
          make install
          make test
```

## Troubleshooting

### Check Python Version

```bash
# With venv activated
python --version
pip --version
```

### Verify Virtual Environment

```bash
which python       # Unix
where python       # Windows

# Should show path inside venv directory
```

### List Installed Packages

```bash
# With venv activated
pip list
pip freeze
```

### Reinstall Dependencies

```bash
# With venv activated
pip install -r requirements.txt --force-reinstall
```

## Best Practices

1. **Always activate the venv** before running Python commands
2. **Use `make install`** instead of manual setup
3. **Keep requirements.txt** updated with `pip freeze`
4. **Don't commit the venv** directory to version control
5. **Use the Makefile** for consistency across the team
6. **Test on multiple platforms** (Linux, macOS, Windows) if possible

## Additional Resources

- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [Make tutorial](https://www.gnu.org/software/make/manual/)
- [Project README](README.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: 2026-06-18  
**Platform Support**: Windows, macOS, Linux
