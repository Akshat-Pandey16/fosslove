from __future__ import annotations

import uvicorn

from fosslove.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "fosslove.main:app",
        host="0.0.0.0",
        port=8000,
        reload=not settings.is_production,
        workers=1 if not settings.is_production else 4,
        log_config=None,
    )


if __name__ == "__main__":
    main()
