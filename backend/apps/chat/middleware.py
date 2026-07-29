from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    """
    Validates SimpleJWT access token and returns the corresponding User object.
    Returns AnonymousUser on failure.
    """
    try:
        validated_token = AccessToken(token_str)
        user_id = validated_token['user_id']
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom Channels middleware that authenticates WebSocket connections
    using a JWT access token passed via query parameters (?token=...).
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token_list = query_params.get('token')

        if token_list and len(token_list) > 0:
            token_str = token_list[0]
            scope['user'] = await get_user_from_token(token_str)
        else:
            # Also check headers for Authorization: Bearer <token>
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode('utf-8')
            if auth_header.startswith('Bearer '):
                token_str = auth_header.split(' ')[1]
                scope['user'] = await get_user_from_token(token_str)
            else:
                scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)
