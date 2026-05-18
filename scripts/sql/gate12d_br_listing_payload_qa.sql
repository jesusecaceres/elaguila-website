-- Gate 12D-2 QA: run after applying the migration and publishing a fresh BR listing.
-- Scope: public.listings rows where category = 'bienes-raices' only.

with br_rows as (
  select
    l.id,
    l.leonix_ad_id,
    l.title,
    l.status,
    l.is_published,
    l.city,
    l.state,
    l.zip,
    l.price,
    l.description,
    l.images,
    l.mux_status,
    l.mux_asset_id,
    l.mux_playback_id,
    l.mux_thumbnail_url,
    l.detail_pairs,
    l.business_meta,
    l.listing_json,
    l.profile_json,
    l.contact_json,
    l.created_at,
    l.published_at,
    l.updated_at
  from public.listings l
  where l.category = 'bienes-raices'
),
extracted as (
  select
    r.*,
    (
      select dp.value::jsonb
      from jsonb_to_recordset(coalesce(r.detail_pairs, '[]'::jsonb)) as dp(label text, value text)
      where dp.label = 'Leonix:br_gate12d_v1'
      limit 1
    ) as br_gate12d_from_detail_pairs,
    (
      select dp.value::jsonb
      from jsonb_to_recordset(coalesce(r.detail_pairs, '[]'::jsonb)) as dp(label text, value text)
      where dp.label = 'Leonix:contact_channels_v1'
      limit 1
    ) as contact_channels_from_detail_pairs,
    (
      select dp.value
      from jsonb_to_recordset(coalesce(r.detail_pairs, '[]'::jsonb)) as dp(label text, value text)
      where dp.label = 'Leonix:postal_code'
      limit 1
    ) as zip_from_detail_pairs,
    (
      select dp.value
      from jsonb_to_recordset(coalesce(r.detail_pairs, '[]'::jsonb)) as dp(label text, value text)
      where dp.label = 'Leonix:pets_allowed'
      limit 1
    ) as generic_pets_machine_value
  from br_rows r
),
payload as (
  select
    e.*,
    coalesce(e.listing_json #> '{br,gate12d}', e.br_gate12d_from_detail_pairs, '{}'::jsonb) as br12d,
    coalesce(e.contact_json -> 'channels', e.contact_channels_from_detail_pairs, '{}'::jsonb) as channels
  from extracted e
)
select
  id,
  leonix_ad_id,
  title,
  status,
  is_published,
  city,
  state,
  zip,
  zip_from_detail_pairs,
  price,
  length(coalesce(description, '')) as description_len,
  jsonb_array_length(coalesce(images, '[]'::jsonb)) as image_count,
  mux_status,
  mux_asset_id is not null as has_mux_asset,
  mux_playback_id is not null as has_mux_playback,
  mux_thumbnail_url is not null as has_mux_thumbnail,
  br12d ->> 'streetAddress' as street_address,
  br12d ->> 'unit' as unit,
  br12d ->> 'neighborhood' as neighborhood,
  br12d ->> 'state' as structured_state,
  br12d ->> 'zip' as structured_zip,
  (
    select dp.value
    from jsonb_to_recordset(coalesce(detail_pairs, '[]'::jsonb)) as dp(label text, value text)
    where dp.label = 'Leonix:br:show_exact_address'
    limit 1
  ) as show_exact_address_flag,
  br12d ->> 'hasHoa' as has_hoa,
  br12d ->> 'hoaFee' as hoa_fee,
  br12d ->> 'hoaFrequency' as hoa_frequency,
  br12d ->> 'hoaIncludes' as hoa_includes,
  br12d ->> 'communityRules' as community_rules,
  br12d ->> 'petRules' as pet_rules_under_hoa,
  generic_pets_machine_value,
  br12d ->> 'rentalRestrictions' as rental_restrictions,
  br12d ->> 'shortTermRentalAllowed' as short_term_rental_allowed,
  br12d ->> 'parkingRules' as parking_rules,
  br12d ->> 'openHouseEnabled' as open_house_enabled,
  br12d ->> 'openHouseDate' as open_house_date,
  br12d ->> 'openHouseStartTime' as open_house_start_time,
  br12d ->> 'openHouseEndTime' as open_house_end_time,
  br12d ->> 'showingByAppointment' as showing_by_appointment,
  br12d ->> 'showingInstructions' as showing_instructions,
  br12d ->> 'virtualTourUrl' as virtual_tour_url,
  channels ->> 'website' as contact_website,
  channels ->> 'instagram' as contact_instagram,
  channels ->> 'facebook' as contact_facebook,
  channels ->> 'youtube' as contact_youtube,
  channels ->> 'tiktok' as contact_tiktok,
  channels ->> 'allowCall' as allow_call,
  channels ->> 'allowSms' as allow_sms,
  channels ->> 'whatsappEnabled' as whatsapp_enabled,
  channels ->> 'preferred' as preferred_contact,
  channels ->> 'instructions' as contact_instructions,
  detail_pairs as raw_detail_pairs,
  business_meta as raw_business_meta,
  listing_json as raw_listing_json,
  profile_json as raw_profile_json,
  contact_json as raw_contact_json,
  created_at,
  published_at,
  updated_at
from payload
order by coalesce(published_at, created_at, updated_at) desc
limit 25;
