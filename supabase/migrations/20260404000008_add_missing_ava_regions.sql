-- Add AVA regions found in CSV data but missing from the original enum.
-- bennett-valley, chalk-hill, fort-ross-seaview are legitimate Sonoma County AVAs.
alter type ava_region add value if not exists 'bennett_valley';
alter type ava_region add value if not exists 'chalk_hill';
alter type ava_region add value if not exists 'fort_ross_seaview';
