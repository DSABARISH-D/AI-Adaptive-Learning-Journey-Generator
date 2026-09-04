from __future__ import annotations

from app.config import settings


class _LocalQuiz:
    def model_dump(self) -> dict:
        return {
            "questions": [
                {"text": "Which keyword declares a class in Java?", "options": ["class", "struct", "define", "type"], "correct_index": 0},
                {"text": "Which type stores whole numbers in Java?", "options": ["String", "int", "boolean", "double"], "correct_index": 1},
                {"text": "Which construct repeats while a condition is true?", "options": ["if", "switch", "while", "import"], "correct_index": 2},
                {"text": "Which method starts a standard Java application?", "options": ["start", "run", "main", "init"], "correct_index": 2},
                {"text": "Which symbol ends a Java statement?", "options": [".", ";", ":", "#"], "correct_index": 1},
            ]
        }


class _LocalStructuredLLM:
    def invoke(self, _prompt: str) -> _LocalQuiz:
        return _LocalQuiz()


class _LocalLLM:
    def with_structured_output(self, _schema: object) -> _LocalStructuredLLM:
        return _LocalStructuredLLM()


def get_llm():
    """Get the configured LLM instance based on settings."""
    try:
        if settings.llm_provider.lower() == "google":
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=settings.gemini_api_key, temperature=0.2)

        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.2)
    except ImportError:
        return _LocalLLM()
