def get_real_fashion_model_photo(clothing_type: str, gender: str = "Male", index: int = 0) -> str:
    is_male = "male" in (gender or "").lower() and "female" not in (gender or "").lower()
    lower = (clothing_type or "").lower()

    if is_male:
        if any(k in lower for k in ["panche", "veshti", "dhoti", "mundu", "lungi"]):
            photos = [
                "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80"
            ]
        elif any(k in lower for k in ["modi", "nehru", "vest"]):
            photos = [
                "https://images.unsplash.com/photo-1597983073493-88cd35cf06b0?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80"
            ]
        elif any(k in lower for k in ["sherwani", "bandhgala", "kurta"]):
            photos = [
                "https://images.unsplash.com/photo-1597983073493-88cd35cf06b0?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80"
            ]
        elif any(k in lower for k in ["tuxedo", "suit", "blazer"]):
            photos = [
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80"
            ]
        else: # Casual / Shirts
            photos = [
                "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1000&q=80"
            ]
    else: # Female
        if any(k in lower for k in ["saree", "sari"]):
            photos = [
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80"
            ]
        elif any(k in lower for k in ["lehenga", "sharara", "anarkali", "garara"]):
            photos = [
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80"
            ]
        elif any(k in lower for k in ["blazer", "suit"]):
            photos = [
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80"
            ]
        else: # Kurta / Dress / Casual
            photos = [
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"
            ]

    return photos[index % len(photos)]

print("Saree Photo:", get_real_fashion_model_photo("Banarasi Silk Saree", "Female"))
print("Tuxedo Photo:", get_real_fashion_model_photo("Classic Black Tie Tuxedo", "Male"))
print("Panche Photo:", get_real_fashion_model_photo("Panche / Veshti Set", "Male"))
