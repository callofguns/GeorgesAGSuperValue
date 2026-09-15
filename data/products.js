/*
  Weekly ad items, taken straight from the paper flyer.
  ----------------------------------------------------
  To change a sale next week, just edit this list. Each item looks like:

    {
      brand: "Barilla",            // the company name (big text)
      name: "Pasta",               // what the product is
      size: "12 - 16 oz Select Varieties",
      price: "$0.98",              // exactly how it prints on the flyer
      unitPrice: 0.98,             // price for ONE item, used for list totals
      category: "pantry",          // must match one of the CATEGORIES ids below
      blockbuster: true            // optional - adds the gold "Blockbuster" badge
    }

  Nothing else in the site needs to change when you edit this file.
*/

// "hue" points at one of the --aisle-* colours in styles.css (the same
// colour-per-department idea as the store's aisle signage). "all" and
// "pantry" are the catch-all buckets, so they stay the neutral brand green
// instead of claiming a colour of their own — leave "hue" off to do that.
const CATEGORIES = [
  { id: "all", label: "All items", icon: "grid" },
  { id: "pantry", label: "Grocery", icon: "can" },
  { id: "bakery", label: "Bakery", icon: "bread", hue: "bakery" },
  { id: "dairy", label: "Dairy", icon: "milk", hue: "dairy" },
  { id: "frozen", label: "Frozen", icon: "snow", hue: "frozen" },
  { id: "household", label: "Household", icon: "home", hue: "household" },
  { id: "beverages", label: "Beer", icon: "bottle", hue: "beverages" }
];

const PRODUCTS = [
  // ---------- Bakery ----------
  {
    brand: "Jessica's Artisan Brick Oven Bakery",
    name: "Tuscan Bread",
    size: "20 oz Select Varieties",
    price: "$2.98",
    unitPrice: 2.98,
    category: "bakery",
    blockbuster: true
  },
  {
    brand: "Country Kitchen",
    name: "Donuts",
    size: "12 oz Select Varieties",
    price: "$3.99",
    unitPrice: 3.99,
    category: "bakery"
  },
  {
    brand: "Country Kitchen",
    name: "Canadian White Bread",
    size: "22 oz",
    price: "$3.49",
    unitPrice: 3.49,
    category: "bakery"
  },

  // ---------- Grocery / pantry ----------
  {
    brand: "Barilla",
    name: "Pasta",
    size: "12 - 16 oz Select Varieties",
    price: "$0.98",
    unitPrice: 0.98,
    category: "pantry",
    blockbuster: true
  },
  {
    brand: "Folgers",
    name: "Coffee",
    size: "9.6 oz Canister or 10 ct K-Cups, Select Varieties",
    price: "$6.99",
    unitPrice: 6.99,
    category: "pantry"
  },
  {
    brand: "Betty Crocker",
    name: "Cake Mix",
    size: "13.25 - 14.25 oz Select Varieties",
    price: "$1.49",
    unitPrice: 1.49,
    category: "pantry"
  },
  {
    brand: "Betty Crocker",
    name: "Frosting",
    size: "12 - 16 oz Select Varieties",
    price: "$1.49",
    unitPrice: 1.49,
    category: "pantry"
  },
  {
    brand: "Old El Paso",
    name: "Enchilada Sauce",
    size: "10 oz Select Varieties",
    price: "$2.29",
    unitPrice: 2.29,
    category: "pantry"
  },
  {
    brand: "Old El Paso",
    name: "Dinner Kit",
    size: "8.8 - 14 oz Select Varieties",
    price: "2/$6",
    unitPrice: 3.0,
    category: "pantry"
  },
  {
    brand: "Old El Paso",
    name: "Queso or Taco Sauce",
    size: "9 oz Select Varieties",
    price: "2/$6",
    unitPrice: 3.0,
    category: "pantry"
  },
  {
    brand: "B&M",
    name: "Baked Beans",
    size: "16 oz Select Varieties",
    price: "2/$3",
    unitPrice: 1.5,
    category: "pantry"
  },
  {
    brand: "Keebler",
    name: "Cookies",
    size: "8.5 - 13.4 oz Select Varieties",
    price: "$4.29",
    unitPrice: 4.29,
    category: "pantry"
  },
  {
    brand: "Chef Boyardee",
    name: "Pasta",
    size: "7.25 - 15 oz Select Varieties",
    price: "$1.99",
    unitPrice: 1.99,
    category: "pantry"
  },
  {
    brand: "Chick-fil-A",
    name: "Sauce",
    size: "16 oz Select Varieties",
    price: "$4.99",
    unitPrice: 4.99,
    category: "pantry"
  },
  {
    brand: "Food Club",
    name: "Pasta Sauce",
    size: "23.9 - 24 oz Select Varieties",
    price: "$1.99",
    unitPrice: 1.99,
    category: "pantry"
  },

  // ---------- Dairy ----------
  {
    brand: "Stonyfield Organic",
    name: "Yogurt",
    size: "32 oz Select Varieties",
    price: "$4.99",
    unitPrice: 4.99,
    category: "dairy"
  },
  {
    brand: "Fage Total",
    name: "Plain Greek Yogurt",
    size: "16 oz Select Varieties",
    price: "$3.49",
    unitPrice: 3.49,
    category: "dairy"
  },
  {
    brand: "Kozy Shack",
    name: "Pudding",
    size: "22 oz Select Varieties",
    price: "$2.99",
    unitPrice: 2.99,
    category: "dairy"
  },
  {
    brand: "Cabot Creamery",
    name: "Cheese",
    size: "Sliced or Cracker Cut 7 - 8 oz Select Varieties",
    price: "2/$6",
    unitPrice: 3.0,
    category: "dairy"
  },
  {
    brand: "McNamara",
    name: "Milk",
    size: "2% Gallon",
    price: "$4.99",
    unitPrice: 4.99,
    category: "dairy"
  },

  // ---------- Frozen ----------
  {
    brand: "Häagen-Dazs",
    name: "Ice Cream",
    size: "9 - 14 oz Select Varieties",
    price: "$4.99",
    unitPrice: 4.99,
    category: "frozen"
  },
  {
    brand: "Snickers, Dove or M&M's",
    name: "Frozen Novelties",
    size: "6.5 - 16 oz Select Varieties",
    price: "$4.49",
    unitPrice: 4.49,
    category: "frozen"
  },

  // ---------- Household ----------
  {
    brand: "Simply Done",
    name: "Ultra Paper Towels",
    size: "6 Triple Rolls",
    price: "$7.98",
    unitPrice: 7.98,
    category: "household",
    blockbuster: true
  },
  {
    brand: "Simply Done",
    name: "Bath Tissue",
    size: "12 Mega Rolls Select Varieties",
    price: "$9.99",
    unitPrice: 9.99,
    category: "household"
  },

  // ---------- Beer ----------
  {
    brand: "Budweiser or Bud Light",
    name: "Beer",
    size: "30 Pack",
    price: "$22.99",
    unitPrice: 22.99,
    category: "beverages"
  }
];
