"""main URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.i18n import i18n_patterns

from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls



# from django.views.generic.base import RedirectView

from django.contrib.staticfiles.storage import staticfiles_storage

from wfavicon.urls import urls as favicon_urls

from wagtail.contrib.sitemaps.views import sitemap




urlpatterns = [
    path('django-admin/', admin.site.urls),

    path('admin/', include(wagtailadmin_urls)),
    path('documents/', include(wagtaildocs_urls)),

    path('sitemap.xml', sitemap),

    # Optional URL for including your own vanilla Django urls/views
    # re_path(r'', include('home.urls')),

    # For anything not caught by a more specific rule above, hand over to
    # Wagtail's serving mechanism
    # re_path(r'', include(wagtail_urls)),
    # path("favicon.ico",RedirectView.as_view(url=staticfiles_storage.url("favicon.ico")),),
]

# print(staticfiles_storage.url("favicon.ico"))


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns() # tell gunicorn where static files are in dev mode
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += path("__reload__/", include("django_browser_reload.urls")),

urlpatterns = urlpatterns + i18n_patterns( 
    # path('search/', search_views.search, name='search'),
    
    path("", include(wagtail_urls)),
    path("", include(favicon_urls)),
    prefix_default_language=False,
)