# События

План и местоположение обработчиков. Регистрация в реальном GA4 ещё не проверена. Первые шесть событий обеспечивает Google tag / Enhanced Measurement. generate_lead вызывается только после ok: true. Все явные вызовы gtag находятся в js/analytics.js.

| Событие | Параметры | Где |
|---|---|---|
| page_view | page_title, page_location | Enhanced Measurement |
| scroll | percent_scrolled | Enhanced Measurement |
| click | link_url, outbound | js/analytics.js:26; js/analytics.js:29; js/analytics.js:30 |
| file_download | file_name, file_extension | Enhanced Measurement |
| form_start | form_id | Enhanced Measurement |
| form_submit | form_id | Enhanced Measurement |
| generate_lead | lead_course, lead_source | js/analytics.js:26; js/form.js:49 |
| cta_click | button_name, page_section | js/analytics.js:26; js/site.js:38 |
| view_course | course_name | js/analytics.js:27 |
| select_course_date | course_name, start_date | js/analytics.js:27 |
| quiz_complete | quiz_result | js/analytics.js:28; js/site.js:39 |
| menu_filter | filter_value | js/analytics.js:28; js/site.js:46 |
| bean_view | bean_name, roast_level | js/analytics.js:28 |
| promo_copy | promo_code | js/analytics.js:29; js/site.js:50 |
| contact_click | contact_type | js/analytics.js:29 |
| messenger_click | messenger | js/analytics.js:29; js/site.js:69 |
| social_click | network, page_section | js/analytics.js:30; js/site.js:63 |
| form_error | field_name, error_type | js/analytics.js:30; js/form.js:19; js/form.js:36; js/form.js:53 |
| map_open | map_service | js/analytics.js:31 |
| gallery_view | photo_index | js/analytics.js:31; js/site.js:56 |

Ключевые: generate_lead, contact_click, messenger_click. Пользовательские определения уровня события: button_name, page_section, course_name, quiz_result, lead_course, bean_name, messenger. map_open и gallery_view дополнительные. bean_view готов в общей схеме обработчика, но фактические карточки сортов не созданы из-за отсутствия каталога. Имена, телефоны и email запрещены в событиях.