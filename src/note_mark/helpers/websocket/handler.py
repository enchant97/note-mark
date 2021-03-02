"""
the message queue handler for websocket updates
"""
import logging
from asyncio import Queue
from typing import Coroutine, Optional
from uuid import UUID
from .types import Message


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
        logging.info("ws client registered, curr clients: %s", self.__clients_count)
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
        logging.info("ws client unregistered, curr clients: %s", self.__clients_count)

    async def broadcast_message(
            self,
            message: Message,
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
                for nb_key in self.__clients[notebook_uuid]:
                    for client in self.__clients[notebook_uuid][nb_key]:
                        await client.put(message)
            elif note_uuid and not notebook_uuid:
                raise ValueError("notebook_uuid required if note_uuid is specified")
            else:
                # broadcast to all
                for notebook in self.__clients:
                    for nb_key in self.__clients[notebook]:
                        for client in self.__clients[notebook][nb_key]:
                            await client.put(message)
        except KeyError:
            # we don't need to know about this error
            pass
