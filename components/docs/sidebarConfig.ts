// components/docs/sidebarConfig.ts
export const docsSidebarConfig = {
  sections: [
    {
      id: 'wiki',
      title: 'Википедия',
      slug: '/wiki',
      children: [
        { id: 'general', title: 'Общая информация', slug: '/wiki' },
        { id: 'community', title: 'Сообщество', slug: '/wiki/community' },
        { id: 'gameplay', title: 'Геймплей', slug: '/wiki/gameplay' },
        { id: 'mechanics', title: 'Механики', slug: '/wiki/mechanics' },
        { id: 'tips', title: 'Советы и хитрости', slug: '/wiki/tips', badge: 'NEW' }
      ]
    },
    {
      id: 'rules',
      title: 'Правила',
      slug: '/rules',
      children: [
        { id: 'general', title: 'Введение', slug: '/rules' },
        { id: 'chat', title: 'Общение и поведение', slug: '/rules/chat' },
        { id: 'griefing', title: 'Гриферство', slug: '/rules/griefing' },
        { id: 'economy', title: 'Экономика', slug: '/rules/economy' },
        { id: 'mods', title: 'Запрещенные модификации', slug: '/rules/mods' },
        { id: 'build', title: 'Строительство', slug: '/rules/build' },
        { id: 'punishments', title: 'Система наказаний', slug: '/rules/punishments', badge: 'ВАЖНО' }
      ]
    }
  ]
}