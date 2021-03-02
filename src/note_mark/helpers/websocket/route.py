"""
functions to help with the websocket receive and sending
"""
import logging
from asyncio import Queue

import orjson
from quart import websocket

from .types import Message


async def ws_send(client_queue: Queue):
    """
    allow for sending messages with a websocket

        :param notebook_uuid: the notebook uuid
        :param note_uuid: the note uuid, defaults to None
        :yield: the event data ready to send
        :raises ValueError: if the note_uuid is
                            specified, but note_uuid is not
    """
    while True:
        data = await client_queue.get()
        if not isinstance(data, Message):
            raise ValueError("invalid message type in ws queue, %s", type(data))
        data = orjson.dumps(data).decode()
        await websocket.send(data)


async def ws_receive():
    while True:
        data = await websocket.receive()
        logging.info("received ws message: %s", data)
