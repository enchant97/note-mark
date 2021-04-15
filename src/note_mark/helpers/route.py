"""
functions to help out with Quart routes
"""
from functools import wraps
from typing import Any, Callable

from quart import current_app, session
from quart_auth import current_user

from .websocket.handler import MessageQueueHandler


def api_login_required(func: Callable) -> Callable:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        if not await current_user.is_authenticated:
            return "you must pass a valid login cookie", 401
        else:
            return await func(*args, **kwargs)
    return wrapper


def admin_authenticated() -> bool:
    if session.get("admin", False) is True:
        return True
    return False


def admin_login_required(func: Callable) -> Callable:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        if not admin_authenticated():
            return "you don't have admin access", 401
        else:
            return await func(*args, **kwargs)
    return wrapper


def admin_login():
    session["admin"] = True


def admin_logout():
    session["admin"] = False


def get_ws_handler() -> MessageQueueHandler:
    """
    allow for getting the
    configured ws client handler

    :return: the message queue handler
    """
    return current_app.config["WS_CLIENTS"]
