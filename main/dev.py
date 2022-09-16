from .settings import *
import environ

env = environ.Env()

environ.Env.read_env()

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
    }
}

SECRET_KEY = env.str("SECRET_KEY")

ALLOWED_HOSTS = tuple(env.list('ALLOWED_HOSTS', default=[]))

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

INSTALLED_APPS = INSTALLED_APPS + [
    'tailwind',
    'theme',
    'django_browser_reload',
    'wagtail.contrib.styleguide',
    # 'django_extensions',
    # # "debug_toolbar",
    # 'wagtail.contrib.styleguide',
]

MIDDLEWARE = MIDDLEWARE + [
    'django_browser_reload.middleware.BrowserReloadMiddleware',
    # "debug_toolbar.middleware.DebugToolbarMiddleware",
]

# TAILWIND_CSS_PATH = './css/main.css'

TAILWIND_APP_NAME = 'theme'

INTERNAL_IPS = [
    "127.0.0.1",
]
