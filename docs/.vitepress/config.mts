import { defineConfig } from "vitepress";
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, "..");
const contentRoot = join(docsRoot, "content"); // Папка с контентом

interface SidebarItem {
  text: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
}

// Конфигурация категорий (можно настроить порядок и свойства)
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
  { name: "Лицензии", collapsed: false, enabled: true },
  // Добавляйте новые категории здесь
];

// Функция сканирования одной категории
function scanCategory(categoryName: string): SidebarItem[] {
  const categoryPath = join(contentRoot, categoryName);
  const items: SidebarItem[] = [];

  if (!existsSync(categoryPath)) {
    console.warn(`Папка "${categoryName}" не найдена по пути: ${categoryPath}`);
    return items;
  }

  console.log(`Сканирую категорию: ${categoryName}`);

  try {
    const scanDirectory = (
      currentPath: string,
      basePath: string = categoryPath
    ): SidebarItem[] => {
      const dirItems: SidebarItem[] = [];
      const files = readdirSync(currentPath);

      for (const file of files) {
        const filePath = join(currentPath, file);
        const stats = statSync(filePath);

        // Игнорируем скрытые файлы
        if (file.startsWith(".") || file === "node_modules") continue;

        if (stats.isDirectory()) {
          const children = scanDirectory(filePath, basePath);
          if (children.length > 0) {
            dirItems.push({
              text: file,
              collapsed: true, // Вложенные папки свернуты
              items: children,
            });
          }
        } else if (file.endsWith(".md") && !file.startsWith("_")) {
          // Формируем правильный путь для ссылки
          const relativePath = relative(basePath, filePath);
          const link = `/content/${categoryName}/${relativePath.replace(
            /\.md$/,
            ""
          )}`;

          // Можно извлечь заголовок из frontmatter, если нужно
          dirItems.push({
            text: file.replace(/\.md$/, ""),
            link: link,
          });
        }
      }

      // Сортировка: папки -> файлы, по алфавиту
      return dirItems.sort((a, b) => {
        const aIsDir = "items" in a && a.items !== undefined;
        const bIsDir = "items" in b && b.items !== undefined;

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.text.localeCompare(b.text);
      });
    };

    const categoryItems = scanDirectory(categoryPath);
    console.log(`  Найдено ${categoryItems.length} элементов`);

    return categoryItems;
  } catch (err) {
    console.error(`Ошибка при сканировании "${categoryName}":`, err);
    return [];
  }
}

// Генерация всего сайдбара
function generateSidebar() {
  const sidebar: SidebarItem[] = [];

  for (const category of categoryConfig) {
    if (!category.enabled) continue;

    const categoryItems = scanCategory(category.name);

    if (categoryItems.length > 0) {
      sidebar.push({
        text: category.name,
        collapsed: category.collapsed,
        items: categoryItems,
      });
    }
  }

  return sidebar;
}

// Конфигурация VitePress
export default defineConfig(async () => {
  const sidebar = generateSidebar();
  console.log(`Всего сгенерировано ${sidebar.length} категорий в сайдбаре`);
  return {
    lang: "ru-RU",
    title: "StarSu_14",
    description: "Справочник по Starfinder (alpha)",
    base: "/StarSu_14/",
    lastUpdated: true,
    //Поиск
    themeConfig: {
      search: {
        provider: "local",
      },
      sidebar:
        sidebar.length > 0
          ? sidebar
          : [
              {
                text: "Содержание",
                items: [
                  { text: "Главная", link: "/" },
                  { text: "Категории не найдены", link: "/" },
                ],
              },
            ],

      // Дополнительные настройки навигации
      nav: [
        { text: "Главная", link: "/" },
        //{ text: "Содержание", link: "/content/" },
        {
          text: "Справочники",
          items: categoryConfig
            .filter((cat) => cat.enabled)
            .map((cat) => ({
              text: cat.name,
              link: `/content/${cat.name}/`,
            })),
        },
      ],
      socialLinks: [
        // Можно добавить любую иконку из simple-icons (https://simpleicons.org/):
        { icon: "telegram", link: "t.me/ThroughThe_Star_Su" },

        // Можно добавить пользовательские иконки, передав SVG в виде строки:
      ],
      footer: {
        message: "Создано с ❤️ для сообщества Starfinder",
      },
    },

    // Настройка маршрутизации
    cleanUrls: true,

    // Опционально: создание индексных страниц для категорий
    async transformPageData(pageData, { siteConfig }) {
      // Автоматически создаем index.md для категорий, если их нет
      if (
        pageData.relativePath.startsWith("content/") &&
        pageData.relativePath.endsWith(".md")
      ) {
        // Логика для обработки страниц категорий
      }
    },
  };
});
