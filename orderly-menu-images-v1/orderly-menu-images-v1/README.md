# Orderly Kitchen menu images v1

Twelve original AI-generated product images prepared for the Orderly portfolio project.

## Installation

Copy the `images/menu` directory into:

```text
apps/web/public/images/menu
```

Database and seed values should use root-relative paths such as:

```text
/images/menu/margherita-pizza-v1.webp
```

## Asset specification

- Format: WebP
- Dimensions: 1200 × 900 pixels (4:3)
- Visual direction: warm limestone background, warm-white serveware, soft upper-left daylight
- Ownership: original images generated for Orderly; no third-party photography or branding

## Product mapping

| Product | Image path |
| --- | --- |
| Margherita Pizza | `/images/menu/margherita-pizza-v1.webp` |
| Pepperoni Pizza | `/images/menu/pepperoni-pizza-v1.webp` |
| BBQ Chicken Pizza | `/images/menu/bbq-chicken-pizza-v1.webp` |
| Roasted Mushroom Pizza | `/images/menu/roasted-mushroom-pizza-v1.webp` |
| Creamy Carbonara | `/images/menu/creamy-carbonara-v1.webp` |
| Beef Bolognese | `/images/menu/beef-bolognese-v1.webp` |
| Garlic Bread | `/images/menu/garlic-bread-v1.webp` |
| Chicken Wings | `/images/menu/chicken-wings-v1.webp` |
| Classic Cola | `/images/menu/classic-cola-v1.webp` |
| Lemon Lime Soda | `/images/menu/lemon-lime-soda-v1.webp` |
| Tiramisu | `/images/menu/tiramisu-v1.webp` |
| Chocolate Fudge Brownie | `/images/menu/chocolate-fudge-brownie-v1.webp` |

## Versioning rule

Do not overwrite or remove published files referenced by order snapshots. When replacing an image, add a new versioned filename such as `margherita-pizza-v2.webp` and update only the current product record.
