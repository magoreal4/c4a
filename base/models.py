from django.db import models
from django.utils.translation import gettext_lazy as _


from wagtail.admin.edit_handlers import (
    FieldPanel,
    MultiFieldPanel,
    # StreamFieldPanel,
)
from wagtail.core.fields import StreamField
from wagtail.core.models import Page
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting

from django.core.cache import cache
# from wagtailsvg.models import Svg
# from wagtailsvg.edit_handlers import SvgChooserPanel

from .blocks import BaseStreamBlock



# @register_setting(icon='dribbble')
# class Logo(BaseSiteSetting):
    
#     logo_png = models.ForeignKey(
#         'wagtailimages.Image',
#         null=True,
#         blank=True,
#         on_delete=models.SET_NULL,
#         related_name='+',
#         verbose_name=_('Logo SVG'),
        
#     )

#     logo_svg = models.ForeignKey(
#         Svg,
#         null=True,
#         blank=True,
#         on_delete=models.SET_NULL,
#         related_name='+',
#         verbose_name=_('logo stamp SVG'),
#         help_text=_("Archivo SVG -- Ejemplo.... <svg class='w-8 h-8' xmlns='http://www.w3.org/2000/svg'    version='1.1' viewBox='0 0 350 350'>   <g transform='translate(-258.272 -38.53)'>  <path fill='currentColor' d='m342.425 ...' />    </g> </svg>")
#     )

#     panels = [
#         MultiFieldPanel([
#             FieldPanel('logo_png'),
#             SvgChooserPanel('logo_svg'),
#         ], heading="Logos"),
#     ]

class StandardPage(Page):
    """
    A generic content page. On this demo site we use it for an about page but
    it could be used for any type of page content that only needs a title,
    image, introduction and body field
    """

    introduction = models.TextField(
        help_text='Text to describe the page',
        blank=True)

    body = StreamField(
        BaseStreamBlock(), 
        verbose_name="Page body", 
        blank=True,
        use_json_field=True
    )
    content_panels = Page.content_panels + [
        FieldPanel('introduction', classname="full"),
        FieldPanel('body'),
    ]
