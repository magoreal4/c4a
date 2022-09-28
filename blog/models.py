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

# class BlogPeopleRelationship(Orderable, models.Model):
#     """
#     This defines the relationship between the `People` within the `base`
#     app and the BlogPage below. This allows People to be added to a BlogPage.

#     We have created a two way relationship between BlogPage and People using
#     the ParentalKey and ForeignKey
#     """
#     page = ParentalKey(
#         'BlogPage', related_name='blog_person_relationship', on_delete=models.CASCADE
#     )
#     people = models.ForeignKey(
#         'base.People', related_name='person_blog_relationship', on_delete=models.CASCADE
#     )
#     panels = [
#         SnippetChooserPanel('people')
#     ]


class BlogPageTag(TaggedItemBase):
    """
    This model allows us to create a many-to-many relationship between
    the BlogPage object and tags. There's a longer guide on using it at
    https://docs.wagtail.org/en/stable/reference/pages/model_recipes.html#tagging
    """
    content_object = ParentalKey('BlogPage', related_name='tagged_items', on_delete=models.CASCADE)

# class BlogPage(Page):
class BlogPage(MetadataPageMixin, Page):

    introduction = models.TextField(
        help_text='Text to describe the page',
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

    body = StreamField(
        BaseStreamBlock(), 
        verbose_name="Page body", 
        use_json_field=True
    )

    order = models.IntegerField(
        help_text="Orden para desplegar los posts",
        default=0
    )
    
    tags = ClusterTaggableManager(
        through=BlogPageTag, 
        blank=True
        )

    date_published = models.DateField(
        "Date article published", 
        blank=True, 
        null=True
    )

    content_panels = Page.content_panels + [
        # FieldPanel('subtitle', classname="full"),
        FieldPanel('introduction', classname="full"),
        FieldPanel('image'),
        FieldPanel('order'),
        FieldPanel('body'),
        FieldPanel('date_published'),
        # InlinePanel(
        #     'blog_person_relationship', label="Author(s)",
        #     panels=None, min_num=1),
        FieldPanel('tags'),
    ]

    search_fields = Page.search_fields + [
        index.SearchField('body'),
    ]

    # def authors(self):
    #     """
    #     Returns the BlogPage's related People. Again note that we are using
    #     the ParentalKey's related_name from the BlogPeopleRelationship model
    #     to access these objects. This allows us to access the People objects
    #     with a loop on the template. If we tried to access the blog_person_
    #     relationship directly we'd print `blog.BlogPeopleRelationship.None`
    #     """
    #     authors = [
    #         n.people for n in self.blog_person_relationship.all()
    #     ]

    #     return authors

    @property
    def get_tags(self):
        """
        Similar to the authors function above we're returning all the tags that
        are related to the blog post into a list we can access on the template.
        We're additionally adding a URL to access BlogPage objects with that tag
        """
        tags = self.tags.all()
        for tag in tags:
            tag.url = '/' + '/'.join(s.strip('/') for s in [
                self.get_parent().url,
                'tags',
                tag.slug
            ])
        return tags

    parent_page_types = ['BlogIndexPage']

    subpage_types = []

    def save(self, *args, **kwargs):
        print("Se actualizó los valores home")
        cache.clear()
        return super().save(*args, **kwargs)

class BlogPageRelatedLink(Orderable):
    page = ParentalKey(BlogPage, on_delete=models.CASCADE, related_name='related_links')
    name = models.CharField(max_length=255)
    url = models.URLField()

    panels = [
        FieldPanel('name'),
        FieldPanel('url'),
    ]

class BlogIndexPage(Page):

    # introduction = models.TextField(
    #     help_text='Text to describe the page',
    #     blank=True
    #     )

    # image = models.ForeignKey(
    #     'wagtailimages.Image',
    #     null=True,
    #     blank=True,
    #     on_delete=models.SET_NULL,
    #     related_name='+',
    #     help_text='Landscape mode only; horizontal width between 1000px and 3000px.'
    #     )

    # content_panels = Page.content_panels + [
    #     FieldPanel('introduction', classname="full"),
    #     ImageChooserPanel('image'),
    #     ]

    # Speficies that only BlogPage objects can live under this index page
    subpage_types = ['BlogPage']

    # Defines a method to access the children of the page (e.g. BlogPage
    # objects). On the demo site we use this on the HomePage
    def children(self):
        return self.get_children().specific().live()

    # Overrides the context to list all child items, that are live, by the
    # date that they were published
    # https://docs.wagtail.org/en/stable/getting_started/tutorial.html#overriding-context
    # def get_context(self, request):
    #     context = super(BlogIndexPage, self).get_context(request)
    #     context['posts'] = BlogPage.objects.live()
    #     # context['posts'] = BlogPage.objects.descendant_of(
    #     #     self).live().order_by(
    #     #     '-date_published')
    #     return context

# alias_of, alias_of_id, aliases, body, content_type, content_type_id, date_published, depth, draft_title, expire_at, expired, first_published_at, formsubmission, go_live_at, group_permissions, has_unpublished_changes, id, image, image_id, index_entries, introduction, last_published_at, latest_revision_created_at, live, live_revision, live_revision_id, locale, locale_id, locked, locked_at, locked_by, locked_by_id, numchild, owner, owner_id, page_ptr, page_ptr_id, path, redirect, related_links, revisions, search_description, seo_title, show_in_menus, sites_rooted_here, slug, subscribers, tagged_items, tags, title, translation_key, url_path, view_restrictions, wagtail_admin_comments, workflow_states, workflowpage

    # This defines a Custom view that utilizes Tags. This view will return all
    # related BlogPages for a given Tag or redirect back to the BlogIndexPage.
    # More information on RoutablePages is at
    # https://docs.wagtail.org/en/stable/reference/contrib/routablepage.html
    @route(r'^tags/$', name='tag_archive')
    @route(r'^tags/([\w-]+)/$', name='tag_archive')
    def tag_archive(self, request, tag=None):

        try:
            tag = Tag.objects.get(slug=tag)
        except Tag.DoesNotExist:
            if tag:
                msg = 'There are no blog posts tagged with "{}"'.format(tag)
                messages.add_message(request, messages.INFO, msg)
            return redirect(self.url)

        posts = self.get_posts(tag=tag)
        context = {
            'tag': tag,
            'posts': posts
        }
        return render(request, 'blog/blog_index_page.html', context)

    def serve_preview(self, request, mode_name):
        # Needed for previews to work
        return self.serve(request)

    # Returns the child BlogPage objects for this BlogPageIndex.
    # If a tag is used then it will filter the posts by tag.
    def get_posts(self, tag=None):
        posts = BlogPage.objects.live().descendant_of(self)
        if tag:
            posts = posts.filter(tags=tag)
        return posts

    # Returns the list of Tags for all child posts of this BlogPage.
    def get_child_tags(self):
        tags = []
        for post in self.get_posts():
            # Not tags.append() because we don't want a list of lists
            tags += post.get_tags
        tags = sorted(set(tags))
        return tags

BlogPage._meta.get_field('title').help_text = 'El título de la página como quieres que sea visto por el público. Dos espacios significa un enter'

from wagtail.contrib.modeladmin.options import ModelAdmin

from .models import BlogPage

class BlogPageAdmin(ModelAdmin):
    model = BlogPage
    list_display = ('introduction', 'image')