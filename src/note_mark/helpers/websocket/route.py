"""
functions to help with the websocket receive and sending
"""
import logging
from asyncio import Queue

from quart import websocket


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
        await websocket.send(data)


async def ws_receive():
    while True:
        data = await websocket.receive()
        logging.info("received ws message: %s", data)
