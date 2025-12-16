from tickets.models import PromotionRule

def calculate_price_with_promotion(seats, ticket_type, screening):
    seats_count = len(seats)
    base_price = ticket_type.price * seats_count

    applicable_promos = [
        p for p in PromotionRule.objects.all()
        if p.matches(seats_count, ticket_type, screening)
    ]

    if not applicable_promos:
        return {
            "base_price": base_price,
            "final_price": base_price,
            "promotion": None
        }

    best = max(applicable_promos, key=lambda p: p.discount_percent)

    discount = base_price * (best.discount_percent / 100)
    final_price = round(base_price - discount, 2)

    return {
        "base_price": base_price,
        "final_price": final_price,
        "promotion": {
            "id": best.id,
            "name": best.name,
            "discount_percent": best.discount_percent
        }
    }
