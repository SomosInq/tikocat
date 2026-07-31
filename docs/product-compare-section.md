# How to use the Product Compare section

Lets shoppers pick a category, then pick two products in that category to see a side-by-side spec comparison table.

## 1. Add the section

In the theme editor, add the **Product compare** section to any page (it's already added to the `/pages/compare` page, linked from the "Compare" button in the filter bar).

## 2. Add categories

Each **Category** block is one dropdown option for shoppers.

1. Click **Add block → Category**.
2. **Category name** – what shows in the category dropdown (e.g. "Clippers", "Grooming essentials").
3. **Products** – pick the products that belong to this category (up to 24). Only products in this list can be compared against each other.
4. Repeat for as many categories as you need. The first category and its first two products are shown by default when the page loads.

## 3. Add comparison specs to each product

The comparison table rows come from a metafield on each product, so **new spec rows never require a theme change** — just add a new entry.

1. In Shopify Admin, open a product → scroll to **Metafields** → find **Compare → Specs**.
2. Click **Add** and fill in:
   - **Label** – the row name shown in the table (e.g. "Battery life")
   - **Value** – that product's value for the row (e.g. "20 hours")
3. Repeat for every spec you want to compare on that product.
4. Do the same for every other product you want comparable — use the **same Label text** across products so rows line up correctly (e.g. always "Battery life", not "Battery Life" on one product and "battery life" on another).

Products don't need matching specs — if one product is missing a spec the other has, that row just shows a dash (—) for the missing side.

Each product's image/name/price at the top of the table links to that product's own page.

> **One-time setup**: if the "Compare → Specs" metafield doesn't exist yet in a store, a developer needs to create it once in Shopify Admin → Settings → Custom data → Products: a metaobject definition called "Compare spec" (fields: Label, Value), then a product metafield "compare.specs" (type: List of metaobjects) referencing it. After that one-time setup, adding new spec rows is metafield-entry work only — no code changes.

## Section settings

- **Heading** – title above the pickers
- **Category select placeholder** / **Product select placeholder** – dropdown prompt text
- **Empty state text** – shown before a category/products are chosen (rare, since defaults are pre-selected)
- **Section width**, **color scheme**, **padding** – standard layout controls
