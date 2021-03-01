"""
functions to help out with Quart routes
"""
from functools import wraps
from typing import Any, Callable

from quart_auth import current_user


def api_login_required(func: Callable) -> Callable:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        if not await current_user.is_authenticated:
            return "you must pass a valid login cookie", 401
        else:
            return await func(*args, **kwargs)
    return wrapper
