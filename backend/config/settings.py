"""
Django settings for config project.
"""

import os 
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

   

    "rest_framework",
"corsheaders",
"accounts",
"branches",
"customers",
"loans",
"cash_collections",
"reconciliation",
"deposits",
"dashboard",

"drf_spectacular",


]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "corsheaders.middleware.CorsMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases



if os.getenv("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.parse(
            os.environ["DATABASE_URL"],
            conn_max_age=600,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "cmrs_db"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = 'static/'


# Email
# https://docs.djangoproject.com/en/6.1/topics/email/#topic-email-configuration

MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}


AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 10,

    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://project-cmrs.vercel.app",
]