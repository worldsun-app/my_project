from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """從字典中獲取值的過濾器"""
    return dictionary.get(key) 