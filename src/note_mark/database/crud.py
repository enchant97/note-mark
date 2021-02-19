"""
functions to allow easy access
to the database models(tables) for the app
"""
from datetime import datetime, timezone
from typing import Generator, List, Tuple, Union
from uuid import UUID

from tortoise.exceptions import DoesNotExist

from .models import Note, Notebook, NotebookLinkShare, NotebookUserShare, User

## notebook auth check ##

async def check_user_notebook_access(
    user_uuid: UUID,
    notebook_uuid: UUID,
    scopes_required : Union[None, tuple] = None) -> Union[str, None]:
    """
    checks whether the user has access to the notebook,
    if so what level ('write', 'read', 'owner').

        :param user_uuid: the user to check for
        :param notebook_uuid: the notebook to check for
        :return: the access level, or None
    """
    scope = None
    # check whether they are the owner
    if await Notebook.filter(
        uuid=notebook_uuid,
        owner_id=user_uuid).get_or_none() is not None:
        scope = "owner"
    # not owner, so check if it's shared with the user
    shared = await NotebookUserShare.filter(
        notebook_id=notebook_uuid,
        shared_with_id=user_uuid).get_or_none()
    # notebook may exist or they do not have access
    if shared is not None:
        if shared.has_write:
            # user has access, check what level
            scope = "write"
        else:
            # user has read access
            scope = "read"
    if scopes_required:
        if scope not in scopes_required:
            # raise if user does not have scopes required
            raise DoesNotExist()
    return scope


async def check_share_link_access(
    link_uuid: UUID,
    scopes_required : Union[None, tuple] = None) -> Union[str, None]:
    """
    checks whether the share-link has access to the notebook,
    if so what level ('write', 'read'),
    will also check for expired links.

        :param user_uuid: the user to check for
        :return: the access level, or None
    """
    link = await NotebookLinkShare.filter(uuid=link_uuid).get_or_none()
    scope = None
    if link is not None and link.expires is not None:
        # check expiry
        if link.expires < datetime.now(timezone.utc):
            await link.delete()
            link = None
    if link is not None:
        if link.has_write:
            scope = "write"
        else:
            scope = "read"
    if scopes_required:
        if scope not in scopes_required:
            # if link does not have required scopes
            raise DoesNotExist()
    return scope

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


async def get_personal_notebook(notebook_uuid: UUID) -> Notebook:
    return await Notebook.filter(uuid=notebook_uuid).get()


async def get_all_personal_notebooks(owner_uuid: UUID) -> List[Notebook]:
    return await Notebook.filter(owner_id=owner_uuid).all()


async def get_shared_notebook(curr_user_uuid: UUID, notebook_uuid: UUID) -> Tuple:
    shared = await NotebookUserShare.filter(shared_with_id=curr_user_uuid, notebook_id=notebook_uuid).get()
    return (await shared.notebook.get(), shared.has_write)


async def get_shared_notebooks(curr_user_uuid: UUID) -> Generator:
    shared = await NotebookUserShare.filter(shared_with_id=curr_user_uuid).all()
    for row in shared:
        yield await row.notebook.get()


async def delete_notebook(notebook_uuid: UUID):
    notebook = await get_personal_notebook(notebook_uuid)
    await notebook.delete()

## NotebookUserShare CRUD ##

async def create_notebook_user_share(
    notebook_uuid: UUID,
    user_uuid: UUID,
    write_access=False) -> NotebookUserShare:
    share = NotebookUserShare(
        notebook_id=notebook_uuid,
        shared_with_id=user_uuid,
        has_write=write_access)
    await share.save()
    return share


async def get_user_shares_by_notebook(notebook_uuid: UUID) -> List[NotebookUserShare]:
    """
    returns all user shares by the notebook

        :param notebook_uuid: the notebook uuid
        :return: list of notebook share rows
    """
    return await NotebookUserShare.filter(notebook_id=notebook_uuid).all()

## NotebookLinkShare CRUD ##

async def create_notebook_link_share(
    notebook_uuid: UUID,
    write_access=False,
    expires=None) -> NotebookLinkShare:
    """
    creates a notebook share link

        :param notebook_uuid: the notebook uuid
        :param write_access: whether the link allows write
                             access, defaults to False
        :param expires: what datetime the link expires
                        (or no expiry), defaults to None
        :return: the created row
    """
    share = NotebookLinkShare(
        notebook_id=notebook_uuid,
        has_write=write_access,
        expires=expires)
    await share.save()
    return share


async def get_link_shares_by_notebook(notebook_uuid: UUID) -> List[NotebookLinkShare]:
    """
    returns all link shares by the notebook

        :param notebook_uuid: the notebook uuid
        :return: list of notebook share link rows
    """
    return await NotebookLinkShare.filter(notebook_id=notebook_uuid).all()


async def get_notebook_by_link_share(link_uuid: UUID) -> UUID:
    """
    gets a returned notebook link share, if one exists

        :param link_uuid: the link uuid
        :return: the share link uuid
    """
    link = await NotebookLinkShare.filter(uuid=link_uuid).get()
    return await link.notebook.get()


## Note CRUD ##

async def create_note(notebook_uuid: UUID, prefix: str) -> Note:
    note = Note(prefix=prefix, notebook_id=notebook_uuid)
    await note.save()
    return note


async def get_note(note_uuid: UUID) -> Note:
    return await Note.filter(uuid=note_uuid).get()


async def get_notes(notebook_uuid: UUID) -> List[Note]:
    return await Note.filter(notebook_id=notebook_uuid).all()


async def delete_note(note_uuid: UUID):
    note = await Note.filter(uuid=note_uuid).get()
    await note.delete()
