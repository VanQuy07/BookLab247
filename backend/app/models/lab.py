# Bảng Lab trong MongoDB (Collection)
LAB_COLLECTION_NAME = "labs"


def lab_helper(lab) -> dict:
    """Hàm map dữ liệu từ MongoDB Dictionary sang format của Pydantic Schema"""
    return {
        "id": str(lab["_id"]),
        "title": lab["title"],
        "capacity": lab["capacity"],
        "priceText": lab.get("priceText", ""),
        "imageUrl": lab["imageUrl"],
    }
