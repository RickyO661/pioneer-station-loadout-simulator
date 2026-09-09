# Pioneer Station importer report

Source inspected: the currently installed `PioneerStation.itm`, `.veh`, `.rpg`, `.cfg`, `.lio`, `.lvl`, `.nws`, and notes files dated September 2026.

## Identified fields

`PioneerStation.itm` is quoted CSV with no header. The stable leading fields are record type, format version, item ID, display name, category, requirement expression, description, then weight in grams and price. The importer uses those fields, retains every original column in `rawFields`, and converts grams to kilograms. Player-facing categories are derived from the category text (`Ammo-*`, `Armor-*`, `Weapons-*`, `Equipment-*` and ordinary player items). Vehicle weapons/components and engine records are excluded by category/type rules rather than a hand-maintained item list.

Armor rows are reliably identifiable as `Armor-*`. Three paired numeric damage values appear at columns 52–57, while three signed values appear at 42–44. Their engine labels are absent from the supplied zone files. The application retains them as `damageChannel1..3` and `mobilityRaw` and labels the defensive display as a working model. It does **not** claim those channels are particular damage names or add Ignore and Protection together.

`PioneerStation.rpg` is quoted CSV. Its class records are identifiable through `Classes - *`; the importer joins them to the player class entries in `.veh` to discard non-playable/unused class artifacts. The file directly identifies Strength, Vitality, Vehicle, Deftness, Technical, Leadership, Power, Commerce and Stamina, including maximum values and IDs. `PioneerStation.veh` is also quoted CSV: player class records have type `2`, with the name at column 3, base HP at column 6 and observed base carry at column 33. This produces Jump Trooper HP 80 and base carry 30 kg.

The supporting `.cfg`, `.lio`, `.lvl`, and `.nws` describe zone/runtime content but do not presently provide a safer item schema than the fields above. The notes explicitly say regular ammo is consolidated by ammo type; the importer therefore removes old caliber-labelled regular ammo from the normal Ammo list, while retaining special ammo.

## Requirement decoding

The importer decodes bare class IDs and parenthesized `|` groups as class allow/deny rules, and tokens of the form `-12002`, `-15004`, etc. as minimum requested player attributes. It maps IDs to the player-facing class and attribute names from `.rpg`. Thus `Greaves - Alloy` allows specific playable classes and excludes Conscript, yielding **BLOCKED** for Drop Trooper.

Rank/currency gates (`@`, `#`) and percent/flag gates (`%`) are retained in `rawExpression` and surfaced only as “additional game requirement not evaluated” warnings. They are deliberately not falsely translated or used to silently approve an item. Malformed expressions (for example adjacent tokens missing an `&`) are similarly retained and flagged for review.

## Rules intentionally configurable

Carry capacity is isolated as `baseCarryKg + Strength`, matching Jump Trooper 30 kg + Strength 18 = 48 kg. Armor working-model scaling, damage-through calculation, and unidentified channel names live together in `src/rules/config.ts`; nothing in the UI hard-codes per-item balance values.

## Vitality and HP

The RPG definition states that Vitality “Enhances hit points” and caps it at 50. Vehicle records provide each class’s base HP (Jump Trooper: 80), but none of the supplied `.rpg`, `.veh`, `.itm`, notes, or other reviewed zone files defines a Vitality-to-HP equation or progression table. Medical item descriptions mention temporary health effects but do not establish the character Vitality rule. The server-validated rule supplied after this review is isolated as `calculateHP(classBaseHp, vitality) = classBaseHp + vitality`.

## Attribute experience costs

`PioneerStation.cfg` defines `AttributeCostMethod=1`, `AttributeBaseCost=0`, and `AttributeCountPower=2.79`. `PioneerStation.rpg` supplies the individual base price for each attribute. In-game purchase observations confirm Method 1 as `floor(attributeBaseCost × nextLevel^2.79)`, calculated independently for each attribute. For example, Deftness costs 250, 1,729, 5,359, and 11,958 XP for levels 1–4; Strength costs 150, 1,037, 3,215, 7,175, and 13,372 XP for levels 1–5; Vitality costs 125, 864, and 2,679 XP for levels 1–3. The simulator imports the rule and base prices from the zone data, then sums only the purchases between a player's entered current level and their target build level.
