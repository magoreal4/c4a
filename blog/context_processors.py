from wagtail.core.models import Site
from blog.models import BlogPage


def blog_page(request):
    wagtail_site = Site.find_for_request(request)
    context = {
        '3posts': BlogPage.objects.in_site(wagtail_site).live().order_by("-order", "last_published_at")[:3],
        'posts': BlogPage.objects.in_site(wagtail_site).live().order_by("-order", "last_published_at")
    }
    return context