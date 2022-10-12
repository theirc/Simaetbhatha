import Custom404Page, {
  Custom404Strings,
} from '@ircsignpost/signpost-base/dist/src/404-page';
import CookieBanner from '@ircsignpost/signpost-base/dist/src/cookie-banner';
import { MenuOverlayItem } from '@ircsignpost/signpost-base/dist/src/menu-overlay';
import {
  CategoryWithSections,
  ZendeskCategory,
  getCategories,
  getCategoriesWithSections,
  getTranslationsFromDynamicContent,
} from '@ircsignpost/signpost-base/dist/src/zendesk';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import {
  CATEGORIES_TO_HIDE,
  CATEGORY_ICON_NAMES,
  GOOGLE_ANALYTICS_IDS,
  MENU_CATEGORIES_TO_HIDE,
  REVALIDATION_TIMEOUT_SECONDS,
  SEARCH_BAR_INDEX,
  SECTION_ICON_NAMES,
  SITE_TITLE,
  USE_CAT_SEC_ART_CONTENT_STRUCTURE,
  ZENDESK_AUTH_HEADER,
} from '../lib/constants';
import {
  LOCALES,
  Locale,
  getLocaleFromCode,
  getZendeskLocaleId,
} from '../lib/locale';
import { getHeaderLogoProps } from '../lib/logo';
import { getMenuItems } from '../lib/menu';
import {
  COMMON_DYNAMIC_CONTENT_PLACEHOLDERS,
  ERROR_DYNAMIC_CONTENT_PLACEHOLDERS,
  populateCustom404Strings,
  populateMenuOverlayStrings,
} from '../lib/translations';
import { getZendeskUrl } from '../lib/url';

interface Custom404Props {
  currentLocale: Locale;
  // Page title.
  title: string;
  strings: Custom404Strings;
  // A list of |MenuOverlayItem|s to be displayed in the header and side menu.
  menuOverlayItems: MenuOverlayItem[];
}

export default function Custom404({
  currentLocale,
  title,
  strings,
  menuOverlayItems,
}: Custom404Props) {
  const router = useRouter();

  return (
    <Custom404Page
      currentLocale={currentLocale}
      locales={LOCALES}
      title={title}
      strings={strings}
      menuOverlayItems={menuOverlayItems}
      headerLogoProps={getHeaderLogoProps(currentLocale)}
      searchBarIndex={SEARCH_BAR_INDEX}
      cookieBanner={
        <CookieBanner
          strings={strings.cookieBannerStrings}
          googleAnalyticsIds={GOOGLE_ANALYTICS_IDS}
        />
      }
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const currentLocale: Locale = getLocaleFromCode(locale ?? 'en-us');

  let dynamicContent = await getTranslationsFromDynamicContent(
    getZendeskLocaleId(currentLocale),
    COMMON_DYNAMIC_CONTENT_PLACEHOLDERS.concat(
      ERROR_DYNAMIC_CONTENT_PLACEHOLDERS
    ),
    getZendeskUrl(),
    ZENDESK_AUTH_HEADER
  );

  const strings: Custom404Strings = populateCustom404Strings(dynamicContent);

  let categories: ZendeskCategory[] | CategoryWithSections[];
  let menuCategories: ZendeskCategory[] | CategoryWithSections[];
  if (USE_CAT_SEC_ART_CONTENT_STRUCTURE) {
    categories = await getCategoriesWithSections(
      currentLocale,
      getZendeskUrl(),
      (c) => !CATEGORIES_TO_HIDE.includes(c.id)
    );
    categories.forEach(({ sections }) => {
      sections.forEach(
        (s) => (s.icon = SECTION_ICON_NAMES[s.id] || 'help_outline')
      );
    });
    menuCategories = await getCategoriesWithSections(
      currentLocale,
      getZendeskUrl(),
      (c) => !MENU_CATEGORIES_TO_HIDE.includes(c.id)
    );
  } else {
    categories = await getCategories(currentLocale, getZendeskUrl());
    categories = categories.filter((c) => !CATEGORIES_TO_HIDE.includes(c.id));
    categories.forEach(
      (c) => (c.icon = CATEGORY_ICON_NAMES[c.id] || 'help_outline')
    );
    menuCategories = await getCategories(currentLocale, getZendeskUrl());
    menuCategories = menuCategories.filter(
      (c) => !MENU_CATEGORIES_TO_HIDE.includes(c.id)
    );
  }
  const menuOverlayItems = getMenuItems(
    populateMenuOverlayStrings(dynamicContent),
    menuCategories
  );

  return {
    props: {
      currentLocale,
      strings,
      menuOverlayItems,
      categories,
      title: strings.errorStrings.subtitle?.concat(' - ', SITE_TITLE),
    },
    revalidate: REVALIDATION_TIMEOUT_SECONDS,
  };
};
