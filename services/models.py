from __future__ import unicode_literals

from django.contrib import messages
from django.db import models
from django.shortcuts import redirect, render
from django.core.cache import cache

from modelcluster.contrib.taggit import ClusterTaggableManager
from modelcluster.fields import ParentalKey

from taggit.models import Tag, TaggedItemBase

from wagtail.contrib.routable_page.models import route
from wagtail.admin.panels import FieldPanel, StreamFieldPanel
from wagtail.core.fields import StreamField
from wagtail.core.models import Page, Orderable

from wagtail.search import index

from base.blocks import BaseStreamBlock

from wmetadata.models import MetadataPageMixin

class ServicesPage(MetadataPageMixin, Page):

    subtitle = models.TextField(
        blank=True,
        max_length= 45,
        null=True,
        help_text='Subtitulo to describe the services',
        )

    introduction = models.TextField(
        help_text='Service introducion',
        blank=True
        )

    image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text='Landscape mode only; horizontal width between 1000px and 3000px.'
        )

    content = StreamField(
        BaseStreamBlock(), 
        verbose_name="Page body", 
        use_json_field=True
    )

    order = models.IntegerField(
        help_text="Orden para desplegar los posts",
        default=0
    )
    

    content_panels = Page.content_panels + [
        FieldPanel('subtitle', classname="full"),
        FieldPanel('introduction', classname="full"),
        FieldPanel('image'),
        FieldPanel('order'),
        FieldPanel('content'),

    ]



    parent_page_types = ['home.HomePage']

    subpage_types = []

    def save(self, *args, **kwargs):
        print("Se actualizó los valores home")
        cache.clear()
        return super().save(*args, **kwargs)

# BlogPage._meta.get_field('title').help_text = 'El título de la página como quieres que sea visto por el público. Dos espacios significa un enter'

# from wagtail.contrib.modeladmin.options import ModelAdmin

# from .models import BlogPage

# class BlogPageAdmin(ModelAdmin):
#     model = BlogPage
#     list_display = ('introduction', 'image')