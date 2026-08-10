class AuthException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class InvalidCredentialsException(AuthException):
    def __init__(self):
        super().__init__("شماره موبایل یا رمز عبور اشتباه است", 401)

class UserExistsException(AuthException):
    def __init__(self):
        super().__init__("این شماره موبایل قبلاً ثبت شده است", 409)

class OTPExpiredException(AuthException):
    def __init__(self):
        super().__init__("کد تایید منقضی شده است", 410)

class OTPInvalidException(AuthException):
    def __init__(self):
        super().__init__("کد تایید نامعتبر است", 400)

class RateLimitException(AuthException):
    def __init__(self):
        super().__init__("تعداد درخواست بیش از حد مجاز است. لطفاً بعداً تلاش کنید", 429)