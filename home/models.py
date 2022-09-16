from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.cache import cache

from wagtail.admin.panels import (
    FieldPanel,
    MultiFieldPanel,
    # StreamFieldPanel,
)
from wagtail.core.fields import StreamField
from wagtail.core.models import Page
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting

# from wvideos.admin import VideoChooserPanel

from wmetadata.models import MetadataPageMixin

class HomePage(MetadataPageMixin, Page):
    def save(self, *args, **kwargs):
        print("Se actualizó los valores home, borrando cache")
        cache.clear()
        return super().save(*args, **kwargs)

    subpage_types = [
        'services.ServicesPage',
        'base.StandardPage'
    ]

    slogan = models.TextField(
        "Slogan",
        blank=True,
        null=True,
        help_text="Slogan. Double space = enter",
        )
    
    services_title = models.CharField(
        "Titulo Services",
        max_length=50,
        blank=True,
        null=True,
        )
    
    services_intro = models.TextField(
        "Intro Services",
        max_length=350,
        blank=True,
        null=True,
        )

    # header_video = models.ForeignKey(
    #     'wagtailvideos.Video',
    #     related_name='+',
    #     null=True,
    #     on_delete=models.SET_NULL
    #     )

    content_panels = Page.content_panels + [
        FieldPanel('slogan'),
        MultiFieldPanel([
            FieldPanel("services_title"),
            FieldPanel("services_intro"),
        ], heading="Services"),
    ]