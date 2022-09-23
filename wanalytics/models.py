from __future__ import unicode_literals

from django.db import models
from django.utils.translation import gettext_lazy as _

from wagtail.admin.panels import (
    FieldPanel,
    MultiFieldPanel,
    HelpPanel
)
from wagtail.contrib.settings.models import BaseGenericSetting, register_setting

@register_setting(icon='table')
class AnalyticsSettings(BaseGenericSetting):
    """
    Tracking and Google Analytics.
    """
    class Meta:
        verbose_name = _('Analytics')

    # ga_tracking_id = models.CharField(
    #     blank=True,
    #     max_length=255,
    #     verbose_name=_('UA Tracking ID'),
    #     help_text=_('Your Google "Universal Analytics" tracking ID (begins with "UA-")'),
    # )
    ga_g_tracking_id = models.CharField(
        blank=True,
        max_length=255,
        verbose_name=_('G Tracking ID'),
        help_text=_('Your Google Analytics 4 tracking ID (begins with "G-")'),
    )
    # ga_track_button_clicks = models.BooleanField(
    #     default=False,
    #     verbose_name=_('Track button clicks'),
    #     help_text=_('Track all button clicks using Google Analytics event tracking. Event tracking details can be specified in each button’s advanced settings options.'),  # noqa
    # )
    gtm_id = models.CharField(
        blank=True,
        max_length=255,
        verbose_name=_('Google Tag Manager ID'),
        help_text=_('Begins with "GTM-"'),
    )

    gads_id = models.CharField(
        blank=True,
        max_length=255,
        verbose_name=_('Google Ads ID'),
        help_text=_('Begins with "AW-"'),
    )

    head_scripts = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('<head> tracking scripts'),
        help_text=_('Add tracking scripts between the <head> tags.'),
    )
    body_scripts = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('<body> tracking scripts'),
        help_text=_('Add tracking scripts toward closing <body> tag.'),
    )

    panels = [
        HelpPanel(
            heading=_('Know your tracking'),
            content=_(
                '<h3><b>Which tracking IDs do I need?</b></h3>'
                '<p>Before adding tracking to your site, '
                '<a href="https://docs.coderedcorp.com/wagtail-crx/how_to/add_tracking_scripts.html" '  # noqa
                'target="_blank">read about the difference between UA, G, GTM, '
                'and other tracking IDs</a>.</p>'
            ),
        ),
        MultiFieldPanel(
            [
                FieldPanel('ga_g_tracking_id'),
                FieldPanel('gtm_id'),
                FieldPanel('gads_id'),
            ],
            heading=_('Google'),
        ),
        # MultiFieldPanel(
        #     [
        #         FieldPanel('gtm_id'),
        #     ],
        #     heading=_('Google Tag Manager'),
        # ),
        MultiFieldPanel(
            [
                FieldPanel('head_scripts'),
                FieldPanel('body_scripts'),
            ],
            heading=_('Other Tracking Scripts')
        )
    ]