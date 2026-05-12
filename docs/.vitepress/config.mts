import { defineConfig } from "vitepress";
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, "..");
const contentRoot = join(docsRoot, "content");

/* -----------------------------------
  Типы
----------------------------------- */

interface SidebarItem {
  text: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
}

/* -----------------------------------
  Категории StarSu
----------------------------------- */

const categoryConfig = [
  { name: "Создание персонажей", collapsed: true, enabled: true },
  { name: "Темы", collapsed: true, enabled: true },
  { name: "Классы", collapsed: true, enabled: true },
  { name: "Расы", collapsed: true, enabled: true },
  { name: "Заклинания", collapsed: true, enabled: true },
  { name: "Звездолёты", collapsed: true, enabled: true },
  { name: "Черты", collapsed: true, enabled: true },
  { name: "Снаряжение", collapsed: true, enabled: true },
  { name: "Тактические правила", collapsed: true, enabled: true },
  { name: "Миры игры", collapsed: true, enabled: true },
  { name: "Бестиарий", collapsed: true, enabled: true },
  { name: "Ведение игры", collapsed: true, enabled: true },
  { name: "Наследие Pathfinder", collapsed: true, enabled: true },
  { name: "Ширма мастера", collapsed: true, enabled: true },
  { name: "Лицензии", collapsed: false, enabled: true },
];

/* -----------------------------------
  Сканирование папок
----------------------------------- */

function scanCategory(categoryName: string): SidebarItem[] {
  const categoryPath = join(contentRoot, categoryName);

  if (!existsSync(categoryPath)) {
    console.warn(`⚠ Категория не найдена: ${categoryName}`);
    return [];
  }

  const scanDirectory = (
    currentPath: string,
    basePath: string = categoryPath
  ): SidebarItem[] => {
    const result: SidebarItem[] = [];
    const files = readdirSync(currentPath);

    for (const file of files) {
      if (file.startsWith(".") || file === "node_modules") continue;

      const filePath = join(currentPath, file);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        const children = scanDirectory(filePath, basePath);

        if (children.length) {
          result.push({
            text: file,
            collapsed: true,
            items: children,
          });
        }
      }

      if (stats.isFile() && file.endsWith(".md") && !file.startsWith("_")) {
        const relativePath = relative(basePath, filePath)
          .replace(/\\/g, "/")
          .replace(/\.md$/, "");

        result.push({
          text: file.replace(/\.md$/, ""),
          link: `/content/${categoryName}/${relativePath}`,
        });
      }
    }

    // Сортировка: сначала папки, потом файлы
    return result.sort((a, b) => {
      const aFolder = !!a.items;
      const bFolder = !!b.items;

      if (aFolder && !bFolder) return -1;
      if (!aFolder && bFolder) return 1;

      return a.text.localeCompare(b.text, "ru");
    });
  };

  return scanDirectory(categoryPath);
}

/* -----------------------------------
  Генерация sidebar
----------------------------------- */

function generateSidebar(): SidebarItem[] {
  return categoryConfig
    .filter((cat) => cat.enabled)
    .map((cat) => {
      const items = scanCategory(cat.name);

      if (!items.length) return null;

      return {
        text: cat.name,
        collapsed: cat.collapsed,
        items,
      };
    })
    .filter(Boolean) as SidebarItem[];
}

/* -----------------------------------
  VitePress Config
----------------------------------- */

export default defineConfig(async () => {
  const sidebar = generateSidebar();

  console.log(`✅ Загружено категорий: ${sidebar.length}`);

  return {
    lang: "ru-RU",
    title: "StarSu - Справочник Starfinder",
    titleTemplate: ":title | StarSu",
    description: "Полный справочник настольно-ролевой игры Starfinder на русском языке. Классы персонажей, расы, темы, заклинания, звездолёты, бестиарий и правила.",
    base: "/",
    
    /* SEO и Performance */
    appearance: "dark",
    ignoreDeadLinks: false,
    
    sitemap: {
      hostname: "https://starsu.ru",
      transformItems: (items) => {
        return items.filter((item) => !item.url.includes("migration"))
      },
    },

    lastUpdated: true,

    markdown: {
      image: {
        lazyLoading: true,
      },
    },

    cleanUrls: false,
    /* ---------- favicons ---------- */
    head: [
      /* SEO и Meta-теги */
      ["meta", { charset: "utf-8" }],
      ["meta", { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" }],
      ["meta", { name: "theme-color", content: "#1e293b" }],
      ["meta", { name: "color-scheme", content: "light dark" }],
      
      /* Яндекс верификация */
      ["meta", { name: "yandex-verification", content: "73e3bb3c02404b9a" }], 
      
      /* Google верификация */
      ["meta", { name: "google-site-verification", content: "2JLrqa8dANHIWIqYFVLYA2-_XlAIrT7rVLP7AYqSG4Q" }],
      
      /* GEO таргетирование */
      ["meta", { name: "geo.placename", content: "Russia" }],
      ["meta", { name: "geo.region", content: "RU" }],
      ["meta", { name: "ICBM", content: "55.7558, 37.6173" }], // Координаты России (центр)
      
      /* Open Graph теги */
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:title", content: "StarSu - Справочник по Starfinder" }],
      ["meta", { property: "og:description", content: "Полный справочник настольно-ролевой игры Starfinder на русском языке. Классы, расы, заклинания, звездолёты, бестиарий и правила." }],
      ["meta", { property: "og:site_name", content: "StarSu" }],
      ["meta", { property: "og:url", content: "https://starsu.ru" }],
      ["meta", { property: "og:locale", content: "ru_RU" }],
      
      /* Twitter Card теги */
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: "StarSu - Справочник по Starfinder" }],
      ["meta", { name: "twitter:description", content: "Полный справочник настольно-ролевой игры Starfinder на русском языке" }],
      
      /* Дополнительные SEO теги */
      ["meta", { name: "author", content: "StarSu Community" }],
      ["meta", { name: "copyright", content: "© 2024 StarSu. Starfinder is licensed under the Open Game License" }],
      ["meta", { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }],
      
      /* Канонический URL */
      ["link", { rel: "canonical", href: "https://starsu.ru" }],
      
      /* Альтернативные языки */
      ["link", { rel: "alternate", hrefLang: "ru", href: "https://starsu.ru" }],
      ["link", { rel: "alternate", hrefLang: "x-default", href: "https://starsu.ru" }],
      
      /* Favicons */
      ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
      ],
      [
        "link",
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/android-chrome-192x192.png",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "512x512",
          href: "/android-chrome-512x512.png",
        },
      ],
      ["link", { rel: "manifest", href: "/site.webmanifest" }],
      
      /* Security headers */
      ["meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }],
      
      /* Structured Data (JSON-LD) */
      [
        "script",
        { type: "application/ld+json" },
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "StarSu",
          "url": "https://starsu.ru",
          "description": "Справочник по настольно-ролевой игре Starfinder на русском языке",
          "inLanguage": "ru-RU",
          "author": {
            "@type": "Organization",
            "name": "StarSu Community",
            "url": "https://starsu.ru",
            "sameAs": [
              "https://t.me/ThroughThe_Star_Su"
            ]
          },
          "searchAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://starsu.ru?q={search_term_string}"
            }
          }
        })
      ]
    ],

    /* ---------- Тема и локализация ---------- */
    themeConfig: {
    

    outlineTitle: "На этой странице",
    lastUpdatedText: "Последнее обновление",
    returnToTopLabel: "Наверх",

    darkModeSwitchLabel: "Тема",
    lightModeSwitchTitle: "Светлая тема",
    darkModeSwitchTitle: "Тёмная тема",

      docFooter: {
        prev: "Предыдущая страница",
        next: "Следующая страница",
      },

      /* ---------- Поиск ---------- */

      search: {
        provider: "local",
        options: {
          translations: {
            button: {
              buttonText: "Поиск",
              buttonAriaLabel: "Поиск",
            },
            modal: {
              noResultsText: "Ничего не найдено",
              resetButtonTitle: "Очистить",
              footer: {
                selectText: "выбрать",
                navigateText: "перейти",
                closeText: "закрыть",
              },
            },
          },
        },
      },

      /* ---------- Sidebar ---------- */

      sidebar:
        sidebar.length > 0
          ? sidebar
          : [
              {
                text: "Содержание",
                items: [{ text: "Главная", link: "/" }],
              },
            ],

      /* ---------- Навигация ---------- */

      nav: [{ text: "Главная", link: "/" }],

      /* ---------- Соцсети ---------- */

      socialLinks: [
        { icon: "telegram", link: "https://t.me/ThroughThe_Star_Su" },
      ],

      footer: {
        message: "Создано с ❤️ для сообщества Starfinder",
      },
    },
  };
});