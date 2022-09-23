from __future__ import unicode_literals

from django.db import models
from django.utils.translation import gettext_lazy as _

from wagtail.admin.panels import (
    FieldPanel,
    MultiFieldPanel,
)

from wagtail.contrib.settings.models import BaseGenericSetting, register_setting

@register_setting(icon='facebook')
class Social(BaseGenericSetting):

    facebook = models.URLField(
        blank=True, 
        null=True, 
        help_text="facebook page"
        )
    
    instagram = models.URLField(
        blank=True, 
        null=True, 
        help_text="instagram"
        )

    tiktok = models.URLField(
        blank=True, 
        null=True, 
        help_text="tiktok"
        )

    youtube = models.URLField(
        blank=True, 
        null=True,
        help_text="youtube channel"
        )

    panels = [
        MultiFieldPanel([
            FieldPanel("facebook"),
            FieldPanel("instagram"),
            FieldPanel("tiktok"),
            FieldPanel("youtube"),
        ], heading="Social Media Settings"),
    ]

@register_setting(icon='cog')
class GeneralSettings(BaseGenericSetting):

    address = models.TextField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_('Address'),
        help_text=_('Business address'),
    )

    lat = models.FloatField(
        blank=True,
        null=True,
        max_length=12,
        verbose_name=_('Latitude'),
    )

    lon = models.FloatField(
        blank=True,
        null=True,
        max_length=12,
        verbose_name=_('Longitude'),
    )

    tel = models.CharField(
        blank=True,
        null=True,
        max_length=12,
        verbose_name=_('Phone'),
        help_text=_('+591 3XXXXXXXX'),
    )

    cel = models.CharField(
        blank=True,
        null=True,
        max_length=12,
        verbose_name=_('celular phone 1 '),
        help_text=_('+591 XXXXXXXX Whatsapp'),
    )

    mjeGlobo = models.CharField(
        blank=True,
        null=True,
        max_length=128,
        verbose_name=_('Mensaje Globo whatsapp'),
        help_text=_('En caso dejar en blanco, no se mostrara el globo'),
    )

    cel2 = models.CharField(
        blank=True,
        null=True,
        max_length=12,
        verbose_name=_('celular phone 2'),
        help_text=_('+591 XXXXXXXX'),
    )

    email = models.CharField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_('email address'),
        help_text=_('The default email address this site appears to send from. For example: "sender@example.com" or "Sender Name <sender@example.com>" (without quotes)'),
    )



    # search_num_results = models.PositiveIntegerField(
    #     default=10,
    #     verbose_name=_('Number of results per page'),
    # )
    # external_new_tab = models.BooleanField(
    #     default=False,
    #     verbose_name=_('Open all external links in new tab')
    # )

    panels = [
        MultiFieldPanel(
            [
                FieldPanel('cel'),
                FieldPanel('mjeGlobo'),
            ],
            _('Whatsapp')
        ),
        MultiFieldPanel(
            [
                FieldPanel('address'),
                FieldPanel('tel'),
                FieldPanel('cel2'),
                FieldPanel('email'),

            ],
            _('General Data')
        ),
        MultiFieldPanel(
            [
                FieldPanel('lat'),
                FieldPanel('lon'),
            ],
            _('Coordinates GPS')
        ),

    ]

    class Meta:
        verbose_name = _('General Data')

