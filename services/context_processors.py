from wagtail.core.models import Site
from services.models import ServicesPage
from wagtail.core.models import Page, Locale

def service_page(request):
    wagtail_site = Site.find_for_request(request)
    context = {
        'services': ServicesPage.objects.live().filter(locale=Locale.get_active()).order_by("-order", "last_published_at"),
    }
    return context