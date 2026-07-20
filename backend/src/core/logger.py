import logging

import orjson
import structlog

from src.core.settings import settings


def configure_logging() -> None:
    logging.basicConfig(format="%(message)s", level=logging.INFO)

    if settings.is_production:
        renderer = structlog.processors.JSONRenderer(
            serializer=lambda *a, **kw: orjson.dumps(*a, **kw).decode()
        )
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.UnicodeDecoder(),
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
    )


logger = structlog.get_logger()
