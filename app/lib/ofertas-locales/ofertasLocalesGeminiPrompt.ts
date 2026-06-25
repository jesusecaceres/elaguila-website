export const OFERTAS_GEMINI_FLYER_EXTRACTION_PROMPT = `You are an expert grocery weekly ad extraction engine.

Analyze this grocery flyer page image and return ONLY a valid JSON array.

Extract only real product/deal tiles from the flyer.

Ignore:
- store headers
- store logos
- page numbers
- legal disclaimers
- package fine print
- nutrition facts
- barcodes
- ingredients
- NET WT fragments
- CAUTION / warning text
- generic branding-only fragments
- background decoration

Important grocery price rules:
- A large dollar number with small superscript cents means a decimal price.
  Example: big 8 with small 99 means "$8.99", not "$899".
  Example: big 3 with small 99 means "$3.99", not "$399".
- "99¢ LB" means price_amount 0.99 and unit "LB".
- Preserve multi-buy offers exactly:
  "2 FOR $5", "3 FOR $5", "4 FOR $10".
- "FREE" should only be returned if the flyer clearly says the product is free.
- Capture "When you buy 2", "Limit 4", "With Digital Coupon", "CRV", and similar conditions in description or needs_review_reason.

For each product/deal tile, return:
{
  "product_name": string,
  "brand": string or null,
  "description": string or null,
  "price_text": string or null,
  "price_amount": number or null,
  "sale_price_text": string or null,
  "regular_price_text": string or null,
  "savings_text": string or null,
  "unit": "LB" | "EA" | "OZ" | "GAL" | "PK" | "FL_OZ" | "LITER" | "UNIT" | "UNKNOWN",
  "quantity": string or null,
  "deal_type": "SINGLE_UNIT" | "MULTI_BUY" | "WEIGHT_BASED" | "BOGO" | "DIGITAL_COUPON" | "FREE",
  "category": string or null,
  "search_tags": string[],
  "source_page": number,
  "confidence_score": number,
  "needs_review_reason": string,
  "raw_evidence": string
}

Rules:
- Do not hallucinate.
- If product name is unclear, skip the row.
- If price is unclear, keep the row only if it is clearly a real product tile and mark confidence lower with needs_review_reason.
- Prefer clean grocery ad product names over package fine print.
- Separate brand from product name when obvious.
- Put package size like 2 lb, 8 ct, 1.5 liters, 24 pk, 16.9 oz in quantity or description.
- Return JSON only. No markdown. No explanation.`;
