"""
custom datatypes and converters
"""
from datetime import datetime
from typing import Union


def datetime_input_type(
        datetime_str: Union[str, None],
        format_="%Y-%m-%dT%H:%M") -> Union[datetime, None]:
    """
    convert a HTML datetime-local
    input into a python datetime obj

        :param datetime_str: the input datetime str
        :param format_: the datetime format, defaults to '%Y-%m-%dT%H:%M'
        :return: the converted datetime obj or None
    """
    if datetime_str is None or datetime_str == "":
        return None
    return datetime.strptime(datetime_str, format_)
