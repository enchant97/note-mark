"""
the message queue handler for websocket updates
"""
import logging
from asyncio import Queue
from dataclasses import asdict
from typing import Any, Coroutine, Optional
from uuid import UUID, uuid4

try:
    import rapidjson as json
except ImportError:
    import json

from .types import Message


class TokenHandler:
    """
    handles creating and checking tokens
    """
    __tokens = dict()

    def create_token(self, auth_id: Any) -> str:
        """
        create a new token

            :param auth_id: the user that it is associated with
            :return: the created token
        """
        token = uuid4().hex
        self.__tokens[token] = auth_id
        return token

    def check_token(self, token: str) -> bool:
        """
        check whether a token exists

            :param token: token to check
            :return: whether the token exists
        """
        if self.__tokens.get(token) is not None:
            return True
        return False

    def get_token(self, token: str) -> Any:
        """
        get a token auth_id by the token

            :param token: the token
            :return: the auth_id or None
        """
        return self.__tokens.get(token)

    def remove_token(self, token: str) -> None:
        """
        remove a token

            :param token: the token to remove
        """
        self.__tokens.pop(token, None)


class MessageQueueHandler(TokenHandler):
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

    async def __broadcast_note(self, message, notebook_uuid, note_uuid):
        for client in self.__clients[notebook_uuid][note_uuid]:
            await client.put(message)

    async def __broadcast_notebook(self, message, notebook_uuid):
        for nb_key in self.__clients[notebook_uuid]:
            for client in self.__clients[notebook_uuid][nb_key]:
                await client.put(message)

    async def __broadcast_all(self, message):
        for notebook in self.__clients:
            for nb_key in self.__clients[notebook]:
                for client in self.__clients[notebook][nb_key]:
                    await client.put(message)

    @staticmethod
    def message_to_json(message: Message) -> str:
        """
        convert a Message obj to a json string

            :param message: the Message obj to convert
            :return: the json string
        """
        message = asdict(message)
        message["dt_stamp"] = message["dt_stamp"].isoformat()
        return json.dumps(message)

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
            message = self.message_to_json(message)
            if note_uuid and notebook_uuid:
                await self.__broadcast_note(message, notebook_uuid, note_uuid)
            elif not note_uuid and notebook_uuid:
                await self.__broadcast_notebook(message, notebook_uuid)
            elif note_uuid and not notebook_uuid:
                raise ValueError("notebook_uuid required if note_uuid is specified")
            else:
                await self.__broadcast_all(message)
        except KeyError:
            # we don't need to know about this error
            pass
