"""
the database models(tables) for the app
"""

__all__ = [
    "CommonModel",
    "User",
    "Notebook",
    "NotebookUserShare",
    "NotebookLinkShare",
    "Note",
]

from tortoise.fields.data import (BinaryField, BooleanField, CharField,
                                  DatetimeField, UUIDField)
from tortoise.fields.relational import (ForeignKeyField, ForeignKeyRelation,
                                        ReverseRelation)
from tortoise.models import Model
from werkzeug.security import check_password_hash, generate_password_hash


class CommonModel(Model):
    """
    the common abstract model to inherit from.
    has the following fields: uuid, created_at and updated_at
    """
    uuid = UUIDField(pk=True)
    created_at = DatetimeField(auto_now_add=True)
    updated_at = DatetimeField(auto_now=True)

    class Meta:
        abstract = True


class User(CommonModel):
    """
    the user model, inherits from CommonModel
    """
    username = CharField(25, unique=True)
    password_hash = BinaryField()

    owned_notebooks: ReverseRelation["Notebook"]

    def check_password(self, to_check: str) -> bool:
        return check_password_hash(self.password_hash.decode(), to_check)

    def set_password(self, new_password: str):
        self.password_hash = generate_password_hash(new_password).encode()

    class Meta:
        table = "users"


class Notebook(CommonModel):
    """
    the notebook model, inherits from CommonModel
    """
    prefix = CharField(100)
    owner: ForeignKeyRelation[User] = ForeignKeyField("models.User", "owned_notebooks")

    shared_users: ReverseRelation["NotebookUserShare"]
    shared_links: ReverseRelation["NotebookLinkShare"]
    notes: ReverseRelation["Note"]

    class Meta:
        table = "notebooks"


class NotebookUserShare(CommonModel):
    """
    the notebook_user_share model, inherits from CommonModel
    """
    notebook: ForeignKeyRelation[Notebook] = ForeignKeyField("models.Notebook")
    shared_with: ForeignKeyRelation[User] = ForeignKeyField("models.User", "shared_users")
    has_write = BooleanField(default=False)

    class Meta:
        table = "notebook_user_shares"
        unique_together = ("notebook", "shared_with")


class NotebookLinkShare(CommonModel):
    """
    the notebook_link_share model, inherits from CommonModel
    """
    notebook: ForeignKeyRelation[Notebook] = ForeignKeyField("models.Notebook", "shared_links")
    has_write = BooleanField(default=False)
    expires = DatetimeField(null=True)

    class Meta:
        table = "notebook_link_shares"


class Note(CommonModel):
    """
    the note model, inherits from CommonModel
    """
    prefix = CharField(100)
    notebook: ForeignKeyRelation[Notebook] = ForeignKeyField("models.Notebook", "notes")

    class Meta:
        table = "notes"
