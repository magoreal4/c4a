from django import template

from wagtail.core.models import Page, Site

# from base.models import FooterText


register = template.Library()
# https://docs.djangoproject.com/en/3.2/howto/custom-template-tags/

@register.inclusion_tag('breadcrumbs.html', takes_context=True)
def breadcrumbs(context):
    self = context.get('self')
    if self is None or self.depth <= 2:
        # When on the home page, displaying breadcrumbs is irrelevant.
        ancestors = ()
    else:
        ancestors = Page.objects.ancestor_of(
            self, inclusive=True).filter(depth__gt=1)
    return {
        'ancestors': ancestors,
        'request': context['request'],
    }


# @register.inclusion_tag('base/include/footer_text.html', takes_context=True)
# def get_footer_text(context):
#     footer_text = ""
#     if FooterText.objects.first() is not None:
#         footer_text = FooterText.objects.first().body

#     return {
#         'footer_text': footer_text,
#     }
