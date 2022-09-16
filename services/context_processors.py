from wagtail.core.models import Site
from services.models import ServicesPage


def service_page(request):
    wagtail_site = Site.find_for_request(request)
    context = {
        '3services': ServicesPage.objects.in_site(wagtail_site).live().order_by("-order", "last_published_at")[:3],
        'services': ServicesPage.objects.in_site(wagtail_site).live().order_by("-order", "last_published_at")
    }
    return context