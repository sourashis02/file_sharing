from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        auth_tuple = JWTAuthentication.authenticate(self, request)
        if auth_tuple is None:
            return None
        user, token = auth_tuple
        for t in user.tokens:
            if str(t['access'])==str(token):
                print(t['access'])
                return user, token
        raise AuthenticationFailed('Session Expired')