import requests
import json

# Fetch a large batch of records
url = "https://data.cincinnati-oh.gov/resource/rg6p-b3h3.json?$limit=50000"
response = requests.get(url)
data = response.json()

print(f"Total records fetched: {len(data)}")

# Much broader keyword list to capture all food-related establishments
food_keywords = [
    # Grocery & Supermarkets
    'GROCERY', 'MARKET', 'SUPERMARKET', 'FOOD MART', 'FOOD STORE',
    'KROGER', 'ALDI', 'WALMART', 'MEIJER', 'SAVE-A-LOT', 'REMKE', 'FRESH',
    'TRADER JOE', 'WHOLE FOODS', 'IGA', 'PIGGLY', 'JUNGLE JIM',
    
    # Convenience & Quick Marts
    'CONVENIENCE', 'QUICK MART', 'KWIK', 'MINI MART', 'EXPRESS',
    'CORNER STORE', 'BODEGA', 'DELI', 'PANTRY',
    
    # Gas Stations (often sell food)
    'SHELL', 'BP ', 'MARATHON', 'SUNOCO', 'SPEEDWAY', 'THORNTON',
    'UNITED DAIRY', 'UDF', 'CIRCLE K', 'LOVES', "PILOT", 'SHEETZ', 'WAWA',
    'VALERO', 'MOBIL', 'EXXON', 'CHEVRON', 'CITGO', 'GAS', 'FUEL',
    
    # Dollar Stores
    'DOLLAR GENERAL', 'FAMILY DOLLAR', 'DOLLAR TREE', 'FIVE BELOW',
    
    # Pharmacies (sell food items)
    'WALGREENS', 'CVS', 'RITE AID',
    
    # Specialty food stores
    'BAKERY', 'BUTCHER', 'MEAT', 'SEAFOOD', 'FISH', 'PRODUCE',
    'ETHNIC', 'ASIAN', 'MEXICAN', 'INDIAN', 'MIDDLE EAST', 'HALAL', 'KOSHER',
    
    # Farmers markets and local
    'FARMER', 'FINDLAY', 'ORGANIC', 'NATURAL', 'HEALTH FOOD', 'CO-OP',
    
    # Big box stores with groceries
    'TARGET', 'COSTCO', 'SAM\'S CLUB', 'BJ\'S',
    
    # Restaurants and fast food (also food access points)
    'RESTAURANT', 'CAFE', 'DINER', 'GRILL', 'KITCHEN', 'EATERY',
    'MCDONALD', 'WENDY', 'BURGER KING', 'TACO BELL', 'SUBWAY', 'CHIPOTLE',
    'PIZZA', 'CHINESE', 'PANDA', 'KFC', 'POPEYE', 'CHICK-FIL',
    'ARBY', 'SONIC', 'DOMINO', 'PAPA JOHN', 'LITTLE CAESAR',
    
    # Coffee shops
    'STARBUCKS', 'DUNKIN', 'COFFEE', 'TIM HORTON',
    
    # Ice cream and desserts
    'ICE CREAM', 'GRAETER', 'DAIRY QUEEN', 'BASKIN', 'COLD STONE',
    
    # Bars with food
    'BAR & GRILL', 'PUB', 'TAVERN', 'BREWERY',
    
    # Catering and food service
    'CATERING', 'FOOD SERVICE', 'COMMISSARY'
]

seen = set()
filtered = []

for item in data:
    name = (item.get('business_name') or '').upper()
    address = (item.get('address') or '').upper()
    
    try:
        lat = float(item.get('latitude', 0))
        lon = float(item.get('longitude', 0))
    except (ValueError, TypeError):
        continue
    
    # Filter for Cincinnati area coordinates (Lat ~39, Lon ~-84)
    if not (39.0 < lat < 39.25 and -84.7 < lon < -84.35):
        continue
        
    key = f"{name}|{address}"
    if key in seen:
        continue
    
    # Check if any keyword matches
    if any(kw in name for kw in food_keywords):
        seen.add(key)
        
        # Classify by type
        if any(kw in name for kw in ['KROGER', 'ALDI', 'WALMART', 'MEIJER', 'SAVE-A-LOT', 'REMKE', 'TRADER JOE', 'WHOLE FOODS', 'IGA', 'JUNGLE JIM', 'FRESH MARKET', 'TARGET', 'COSTCO', "SAM'S CLUB"]):
            type_label = 'Grocery Store'
        elif any(kw in name for kw in ['DOLLAR GENERAL', 'FAMILY DOLLAR', 'DOLLAR TREE', 'FIVE BELOW']):
            type_label = 'Dollar Store'
        elif any(kw in name for kw in ['SPEEDWAY', 'BP ', 'SHELL', 'MARATHON', 'UDF', 'UNITED DAIRY', 'CIRCLE K', 'SUNOCO', 'THORNTON', 'VALERO', 'MOBIL', 'EXXON', 'CHEVRON', 'CITGO', 'GAS', 'FUEL']):
            type_label = 'Gas Station'
        elif any(kw in name for kw in ['WALGREENS', 'CVS', 'RITE AID']):
            type_label = 'Pharmacy'
        elif any(kw in name for kw in ['MCDONALD', 'WENDY', 'BURGER KING', 'TACO BELL', 'SUBWAY', 'CHIPOTLE', 'KFC', 'POPEYE', 'CHICK-FIL', 'ARBY', 'SONIC', 'DOMINO', 'PAPA JOHN', 'LITTLE CAESAR', 'PIZZA', 'PANDA']):
            type_label = 'Fast Food'
        elif any(kw in name for kw in ['RESTAURANT', 'CAFE', 'DINER', 'GRILL', 'KITCHEN', 'EATERY', 'BAR & GRILL', 'PUB', 'TAVERN', 'BREWERY']):
            type_label = 'Restaurant'
        elif any(kw in name for kw in ['STARBUCKS', 'DUNKIN', 'COFFEE', 'TIM HORTON']):
            type_label = 'Coffee Shop'
        elif any(kw in name for kw in ['ICE CREAM', 'GRAETER', 'DAIRY QUEEN', 'BASKIN', 'COLD STONE']):
            type_label = 'Dessert'
        elif any(kw in name for kw in ['FARMER', 'FINDLAY', 'ORGANIC', 'NATURAL', 'HEALTH FOOD', 'CO-OP']):
            type_label = 'Farmers Market/Health'
        elif any(kw in name for kw in ['BAKERY', 'BUTCHER', 'MEAT', 'SEAFOOD', 'FISH', 'PRODUCE', 'DELI']):
            type_label = 'Specialty Food'
        else:
            type_label = 'Convenience/Market'
            
        filtered.append({
            "Name": item.get('business_name'),
            "Address": item.get('address'),
            "Lat": lat,
            "Long": lon,
            "Type": type_label,
            "Status": item.get('action_status') or 'Unknown',
            "Neighborhood": item.get('community_council_neighborhood') or item.get('neighborhood') or 'N/A'
        })

# Sort by type for better visualization
filtered.sort(key=lambda x: x['Type'])

with open('food_data.json', 'w', encoding='utf-8') as f:
    json.dump(filtered, f, ensure_ascii=False, indent=2)

print(f"Successfully wrote {len(filtered)} records to food_data.json")

# Print breakdown by type
from collections import Counter
type_counts = Counter(item['Type'] for item in filtered)
print("\nBreakdown by type:")
for t, c in type_counts.most_common():
    print(f"  {t}: {c}")
