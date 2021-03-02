from .config import get_settings
from .helpers.websocket.handler import MessageQueueHandler

WS_CLIENTS = MessageQueueHandler(get_settings().MAX_QUEUE_SIZE)
# TODO use cookie auth instead
WS_TOKENS = {}
