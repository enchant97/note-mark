import logging
from asyncio import Queue
from typing import Any, Coroutine, Optional
from uuid import UUID

from quart import websocket

from .config import get_settings


class MessageQueueHandler:
    """
    handle each client Queue,
    and allow for broadcasting
    to different 'rooms'

        :param max_messages: the max messages
                             allowed keep in queue,
                             defaults to -1
    """
    def __init__(self, max_messages: int = -1):
        self.__max_queue_size = max_messages
        self.__clients = {}
        self.__clients_count = 0

    def create_client(
            self,
            notebook_uuid: Optional[UUID] = None,
            note_uuid: Optional[UUID] = None) -> Queue:
        """
        create a new client, and return their Queue

            :param notebook_uuid: the notebook uuid, defaults to None
            :param note_uuid: the note uuid, defaults to None
            :return: the Queue that is assigned to the client
            :raises ValueError: if the note_uuid is
                                specified, but note_uuid is not
        """
        if note_uuid and not notebook_uuid:
            raise ValueError("notebook_uuid required if note_uuid is specified")
        # create the client queue
        client_queue = Queue(self.__max_queue_size)
        # create client 'rooms' if they don't exist
        if self.__clients.get(notebook_uuid) is None:
            self.__clients[notebook_uuid] = {}
        if self.__clients[notebook_uuid].get(note_uuid) is None:
            self.__clients[notebook_uuid][note_uuid] = set()
        # add the client queue to the room
        self.__clients[notebook_uuid][note_uuid].add(client_queue)
        self.__clients_count += 1
        logging.info("new sse client registered, curr clients: %s", self.__clients_count)
        return client_queue

    def remove_client(
            self,
            client: Queue,
            notebook_uuid: Optional[UUID] = None,
            note_uuid: Optional[UUID] = None):
        """
        remove a client

            :param client: the client's Queue
            :param notebook_uuid: the notebook uuid,
                                  defaults to None
            :param note_uuid: the note uuid,
                              defaults to None
            :raises ValueError: if the note_uuid is
                                specified, but note_uuid is not
        """
        if note_uuid and not notebook_uuid:
            raise ValueError("notebook_uuid required if note_uuid is specified")
        self.__clients[notebook_uuid][note_uuid].remove(client)
        self.__clients_count -= 1

    async def broadcast_message(
            self,
            message: Any,
            notebook_uuid: Optional[UUID] = None,
            note_uuid: Optional[UUID] = None) -> Coroutine:
        """
        broadcast a message
        (add message to each client queue)

            :param message: the message to send
            :param notebook_uuid: the notebook_uuid,
                                  defaults to None
            :param note_uuid: the note_uuid,
                              defaults to None
            :raises ValueError: if the note_uuid is
                                specified, but note_uuid is not
        """
        try:
            if note_uuid and notebook_uuid:
                # broadcast all in specific note
                for client in self.__clients[notebook_uuid][note_uuid]:
                    await client.put(message)
            elif not note_uuid and notebook_uuid:
                # broadcast all in specific notebook
                for room in self.__clients[notebook_uuid]:
                    for client in room:
                        await client.put(message)
            elif note_uuid and not notebook_uuid:
                raise ValueError("notebook_uuid required if note_uuid is specified")
            else:
                # broadcast to all
                for notebook in self.__clients:
                    for room in notebook:
                        for client in room:
                            await client.put(message)
        except KeyError:
            # we don't need to know about this error
            pass


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


WS_CLIENTS = MessageQueueHandler(get_settings().MAX_QUEUE_SIZE)
# TODO use cookie auth instead
WS_TOKENS = {}
