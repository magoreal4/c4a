from wagtail.core.models import Site
from services.models import ServicesPage


def service_page(request):
    wagtail_site = Site.find_for_request(request)
    context = {
        'services': ServicesPage.objects.in_site(wagtail_site).live().order_by("-order", "last_published_at"),
    }
    return context