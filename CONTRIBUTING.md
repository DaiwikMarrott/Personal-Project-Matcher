# Contributing to Project Jekyll & Hyde

First off, thank you for considering contributing to Project Jekyll & Hyde! 🎉

## Code of Conduct

This project and everyone participating in it is governed by a commitment to provide a welcoming and inspiring community for all. Please be respectful and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues. When creating a bug report, include:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples**
* **Describe the behavior you observed and what you expected**
* **Include screenshots if applicable**
* **Include your environment details** (OS, browser, Node version, Python version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the proposed functionality**
* **Explain why this enhancement would be useful**
* **List any similar features in other projects** (if applicable)

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **If you've added code that should be tested**, add tests
3. **Ensure the test suite passes**
4. **Make sure your code follows the existing style**
5. **Write a clear commit message**

#### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation with any new environment variables, exposed ports, etc.
3. The PR will be merged once you have the sign-off of at least one maintainer

## Development Setup

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` - Improving structure/format of the code
    * ⚡ `:zap:` - Improving performance
    * 🐛 `:bug:` - Fixing a bug
    * ✨ `:sparkles:` - Adding a new feature
    * 📝 `:memo:` - Writing docs
    * ♻️ `:recycle:` - Refactoring code

### Python Styleguide

* Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
* Use type hints where applicable
* Document functions with docstrings
* Maximum line length: 100 characters

### TypeScript Styleguide

* Follow the existing ESLint configuration
* Use functional components with hooks
* Use TypeScript interfaces for props
* Document complex components with JSDoc comments
* Maximum line length: 100 characters

### Documentation Styleguide

* Use [Markdown](https://guides.github.com/features/mastering-markdown/)
* Reference functions, methods, and classes with backticks: `functionName()`

## Project Structure

```
Personal-Project-Matcher/
├── backend/              # FastAPI Python backend
│   ├── main.py          # API endpoints
│   ├── ai_service.py    # AI utilities (Gemini)
│   ├── schema.sql       # Database schema
│   └── requirements.txt # Python dependencies
├── frontend/            # React Native (Expo) frontend
│   ├── app/            # Expo Router pages
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, etc.)
│   └── package.json    # Node dependencies
└── README.md           # Project documentation
```

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Need Help?

Feel free to create an issue with the `question` label if you need help or clarification.

## Recognition

Contributors will be recognized in the project README. Thank you for making Project Jekyll & Hyde better! 🚀
