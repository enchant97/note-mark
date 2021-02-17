"""
functions to allow easy access
to the database models(tables) for the app
"""
from uuid import UUID

from .models import User

## User CRUD ##

async def create_user(username: str, password: str) -> User:
    """
    create a new user

        :param username: the username
        :param password: the password
        :return: the created User row
    """
    user = User(username=username)
    user.set_password(password)
    await user.save()
    return user


async def check_user(username: str, password: str) -> User:
    """
    used to validate whether the user details are valid

        :param username: username to check
        :param password: password to check
        :return: the User or None
    """
    user = await User.filter(username=username).get_or_none()
    if user:
        if user.check_password(password):
            return user
    return None


async def modify_user_password(user_uuid: UUID, new_password: str):
    """
    change a user's password

        :param user_id: the user's uuid
        :param new_password: the new password
    """
    user = await User.filter(uuid=user_uuid).get()
    user.set_password(new_password)
    await user.save()


async def delete_user(user_uuid: UUID):
    """
    delete a user by their uuid

    :param user_id: [description]
    """
    await User.filter(uuid=user_uuid).delete()
