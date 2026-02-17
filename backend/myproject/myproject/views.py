import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Item


def json_error(message, status=400):
    return JsonResponse({'error': message}, status=status)


@method_decorator(csrf_exempt, name='dispatch')
class ItemListView(View):
    """
    GET  /api/items/       - List all items
    POST /api/items/       - Create a new item
    """

    def get(self, request):
        items = list(Item.objects.all().values())
        return JsonResponse({'items': items, 'count': len(items)})

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return json_error('Invalid JSON body')

        name = data.get('name', '').strip()
        if not name:
            return json_error('Field "name" is required')

        item = Item.objects.create(
            name=name,
            description=data.get('description', ''),
            price=data.get('price', 0.0),
        )
        return JsonResponse(item.to_dict(), status=201)


@method_decorator(csrf_exempt, name='dispatch')
class ItemDetailView(View):
    """
    GET    /api/items/<id>/  - Retrieve an item
    PUT    /api/items/<id>/  - Update an item
    DELETE /api/items/<id>/  - Delete an item
    """

    def get_object(self, pk):
        try:
            return Item.objects.get(pk=pk)
        except Item.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return json_error('Item not found', status=404)
        return JsonResponse(item.to_dict())

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return json_error('Item not found', status=404)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return json_error('Invalid JSON body')

        item.name = data.get('name', item.name)
        item.description = data.get('description', item.description)
        item.price = data.get('price', item.price)
        item.save()
        return JsonResponse(item.to_dict())

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return json_error('Item not found', status=404)
        item.delete()
        return JsonResponse({'message': f'Item {pk} deleted successfully'})
