```python
from wfavicon.urls import urls as favicon_urls

urlpatterns = [
    path('django-admin/', admin.site.urls),

    path('admin/', include(wagtailadmin_urls)),
    path('documents/', include(wagtaildocs_urls)),

urlpatterns = urlpatterns + [
    path("", include(wagtail_urls)),
    path("", include(favicon_urls)),
]

```

```
{% load favicon_tags %}
  <html>
    <head>
        {% favicon_meta %}
    </head>
```

