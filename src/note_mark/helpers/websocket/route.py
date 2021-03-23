"""
functions to help with the websocket receive and sending
"""
import logging
from asyncio import Queue

from quart import websocket


async def ws_send(client_queue: Queue):
    """
    allow for sending messages with a websocket

        :param client_queue: the queue to
               get messages to send from
    """
    while True:
        data = await client_queue.get()
        await websocket.send(data)


async def ws_receive():
    while True:
        data = await websocket.receive()
        logging.info("received ws message: %s", data)
