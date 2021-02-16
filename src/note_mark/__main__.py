import asyncio
import logging
import signal

from hypercorn.asyncio import serve
from hypercorn.config import Config

from .config import get_settings
from .main import create_app

if __name__ == "__main__":
    config = Config()
    config.loglevel = get_settings().LOG_LEVEL
    config.bind = get_settings().BINDS
    app = create_app()
    loop = asyncio.get_event_loop()
    try:
        shutdown_event = asyncio.Event()
        def _signal_handler(*_) -> None:
                shutdown_event.set()
        loop.add_signal_handler(signal.SIGTERM, _signal_handler)
        loop.run_until_complete(
            serve(app, config, shutdown_trigger=shutdown_event.wait)
        )
    except NotImplementedError:
        logging.info("'add_signal_handler' not supported on this platform, using backup")
        loop.run_until_complete(serve(app, config))
