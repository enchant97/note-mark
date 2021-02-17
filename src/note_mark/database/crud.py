"""
functions to allow easy access
to the database models(tables) for the app
"""
from typing import Generator, List, Tuple
from uuid import UUID

from .models import Note, Notebook, NotebookUserShare, User

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


async def get_users() -> List[User]:
    return await User.all()


async def modify_user_password(user_uuid: UUID, new_password: str):
    """
    change a user's password

        :param user_uuid: the user's uuid
        :param new_password: the new password
    """
    user = await User.filter(uuid=user_uuid).get()
    user.set_password(new_password)
    await user.save()


async def delete_user(user_uuid: UUID):
    """
    delete a user by their uuid

        :param user_uuid: the user's uuid
    """
    await User.filter(uuid=user_uuid).delete()


## Notebook CRUD ##

async def create_notebook(owner_uuid: UUID, prefix: str) -> Notebook:
    notebook = Notebook(owner_id=owner_uuid, prefix=prefix)
    await notebook.save()
    return notebook


async def get_personal_notebook(owner_uuid: UUID, notebook_uuid: UUID) -> Notebook:
    return await Notebook.filter(owner_id=owner_uuid, uuid=notebook_uuid).get()


async def get_all_personal_notebooks(owner_uuid: UUID) -> List[Notebook]:
    return await Notebook.filter(owner_id=owner_uuid).all()


async def get_shared_notebook(curr_user_uuid: UUID, notebook_uuid: UUID) -> Tuple:
    shared = await NotebookUserShare.filter(shared_with_id=curr_user_uuid, notebook_id=notebook_uuid).get()
    return (await shared.notebook.get(), shared.has_write)


async def get_shared_notebooks(curr_user_uuid: UUID) -> Generator:
    shared = await NotebookUserShare.filter(shared_with_id=curr_user_uuid).all()
    for row in shared:
        yield await row.notebook.get()


async def delete_notebook(owner_uuid: UUID, notebook_uuid: UUID):
    notebook = await get_personal_notebook(owner_uuid, notebook_uuid)
    await notebook.delete()

## NotebookUserShare CRUD ##

async def create_notebook_user_share(
    owner_uuid: UUID,
    notebook_uuid: UUID,
    user_uuid: UUID,
    write_access=False) -> NotebookUserShare:
    # check if user has that notebook
    await get_personal_notebook(owner_uuid, notebook_uuid)
    share = NotebookUserShare(
        notebook_id=notebook_uuid,
        shared_with_id=user_uuid,
        has_write=write_access)
    await share.save()
    return share
