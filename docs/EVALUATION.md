# Evaluation

The proposal requires checking response accuracy, relevance, usability, and reliability. This project includes a repeatable technical evaluation for the chatbot API.

Run:

```bash
npm run evaluate
```

The evaluator uses:

```text
backend/evaluation/sample-questions.json
```

It writes:

```text
backend/evaluation/latest-report.md
```

## Scoring

- Category match: 40%
- Expected keyword coverage: 50%
- Positive retrieval confidence: 10%

The report labels each answer as:

- `Pass`
- `Partial`
- `Needs review`

## Human Review

The generated report is a technical check. Final project evaluation should also include human review for:

- Whether the answer is useful and easy to understand
- Whether the answer is grounded in official Hadaf information
- Whether fallback responses avoid unsupported claims
- Whether the chatbot interface is easy for students and parents to use
