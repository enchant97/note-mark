"""
types for creating and reading websocket messages
"""
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import IntEnum, unique
from typing import Optional


@unique
class MessageCategory(IntEnum):
    """
    the category int types for a message
    """
    NOTEBOOK_CREATE = 10
    NOTEBOOK_REMOVE = 11
    NOTEBOOK_PREFIX_CHANGE = 12

    NOTE_CREATE = 20
    NOTE_REMOVE = 21
    NOTE_PREFIX_CHANGE = 22
    NOTE_CONTENT_CHANGE = 23


@dataclass
class Message:
    """
    the message structure for a message
    """
    category: MessageCategory
    dt_stamp: datetime
    payload: Optional[dict] = None


def make_message(category: MessageCategory, payload: Optional[dict] = None) -> Message:
    """
    useful function to quickly create and return a Message obj,
    will set the datetime stamp to current utc time

        :param category: the message category (enum from MessageCategory)
        :param payload: the payload (if required), defaults to None
        :return: the created Message obj
    """
    return Message(category, datetime.now(timezone.utc), payload)
