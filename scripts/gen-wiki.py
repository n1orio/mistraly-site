#!/usr/bin/env python3
"""Собирает базовые статьи вики из исходников мода Mistraly.

    python3 scripts/gen-wiki.py /home/nio/mistraly-season-2/mistraly

Тексты механик берутся из внутриигровой вики (mistraly.wiki.*.text в ru_ru.json),
названия, рецепты и текстуры — оттуда же, поэтому цифры совпадают с игрой.
Страницы про предметы написаны здесь в том же формате, что и игровые:
    # заголовок    • пункт списка    > подсказка    @ a > b*6 + c  цепочка
    R id  рецепт   I a b c  ряд предметов   T a | b  таблица
Всё это переводится в разметку вики (см. статью «Форматирование»), и на выходе
получаются src/data/wiki-data.json и картинки в public/images/wiki.
Правки игроков живут в базе бэкенда и поверх этих статей, пересборка их не трогает.
"""
import glob
import json
import os
import re
import sys

from PIL import Image

MOD = sys.argv[1]
RES = f'{MOD}/src/main/resources'
OUT_JSON = 'src/data/wiki-data.json'
OUT_IMG = 'public/images/wiki'

lang = json.load(open(f'{RES}/assets/mistraly/lang/ru_ru.json'))

VANILLA = {
    'minecraft:stick': 'Палка', 'minecraft:bone': 'Кость', 'minecraft:iron_ingot': 'Железный слиток',
    'minecraft:gold_ingot': 'Золотой слиток', 'minecraft:diamond': 'Алмаз', 'minecraft:emerald': 'Изумруд',
    'minecraft:lapis_lazuli': 'Лазурит', 'minecraft:redstone': 'Редстоун', 'minecraft:glass_pane': 'Стеклянная панель',
    'minecraft:chest': 'Сундук', 'minecraft:raw_iron': 'Сырое железо', 'minecraft:raw_gold': 'Сырое золото',
    'minecraft:raw_copper': 'Сырая медь', 'minecraft:iron_nugget': 'Железный самородок',
    'minecraft:gold_nugget': 'Золотой самородок', 'minecraft:copper_nugget': 'Медный самородок',
    'minecraft:coal': 'Уголь', 'minecraft:grindstone': 'Точило', 'minecraft:diamond_ore': 'Алмазная руда',
    'minecraft:iron_ore': 'Железная руда', 'minecraft:coal_ore': 'Угольная руда',
    'minecraft:netherite_upgrade_smithing_template': 'Шаблон незеритового улучшения',
    '#minecraft:wool': 'Любая шерсть', '#minecraft:planks': 'Любые доски', '#minecraft:meat': 'Любое мясо',
    '#minecraft:netherite_tool_materials': 'Незеритовый слиток', '#minecraft:iron_tool_materials': 'Железный слиток',
    '#minecraft:gold_tool_materials': 'Золотой слиток', '#minecraft:diamond_tool_materials': 'Алмаз',
    '#minecraft:copper_tool_materials': 'Медный слиток', '#mistraly:bone_tool_materials': 'Кость',
    '#mistraly:flint_tool_materials': 'Кремень',
}
# Картинки ванильных предметов не копируем: на сайте нет файлов игры.
BLOCK_ICONS = {'atm': 'atm_front', 'shop': 'shop_side', 'mist_ore': 'mist_ore', 'deepslate_mist_ore': 'deepslate_mist_ore'}

os.makedirs(OUT_IMG, exist_ok=True)
for f in glob.glob(f'{OUT_IMG}/*.png'):
    os.remove(f)


def copy_icon(src, name):
    img = Image.open(src).convert('RGBA')
    if img.height > img.width:              # анимированная текстура: берём первый кадр
        img = img.crop((0, 0, img.width, img.width))
    img.save(f'{OUT_IMG}/{name}.png', optimize=True)


icons = {}
for f in glob.glob(f'{RES}/assets/mistraly/textures/item/*.png'):
    n = os.path.basename(f)[:-4]
    copy_icon(f, n)
    icons[f'mistraly:{n}'] = f'/images/wiki/{n}.png'
for n, tex in BLOCK_ICONS.items():
    copy_icon(f'{RES}/assets/mistraly/textures/block/{tex}.png', n)
    icons[f'mistraly:{n}'] = f'/images/wiki/{n}.png'


def name(i):
    if i in VANILLA:
        return VANILLA[i]
    ns, p = i.lstrip('#').split(':')
    return lang.get(f'item.{ns}.{p}') or lang.get(f'block.{ns}.{p}') or p


recipes = {}
for f in sorted(glob.glob(f'{RES}/data/mistraly/recipe/*.json')):
    r = json.load(open(f))
    t = r['type'].split(':')[1]
    res = r.get('result')
    out = {'result': {'id': res['id'], 'count': res.get('count', 1)}}
    if t == 'crafting_shaped':
        pat = r['pattern']
        out.update(kind='crafting', slots=[r['key'].get(c) if c != ' ' else None for row in pat for c in row.ljust(3)]
                   + [None] * (9 - 3 * len(pat)))
    elif t == 'crafting_shapeless':
        ing = r['ingredients']
        out.update(kind='crafting', slots=ing + [None] * (9 - len(ing)))
    elif t == 'smithing_transform':
        out.update(kind='smithing', slots=[r['template'], r['base']] + ([r['addition']] if 'addition' in r else []))
    elif t in ('smelting', 'blasting'):
        out.update(kind=t, slots=[r['ingredient']])
    else:
        continue
    recipes.setdefault(res['id'], []).append(out)

# Страница каждого предмета: ссылки из рецептов и таблиц ведут на неё.
PAGE_OF = {}
for slug, ids in {
    'mist': 'mist mist_shard raw_mist raw_mist_shard mist_ore deepslate_mist_ore',
    'gems': 'rough_diamond rough_diamond_shard diamond_shard rough_emerald rough_emerald_shard emerald_shard '
            'rough_lazurite rough_lazurite_shard lapis_lazuli_shard',
    'nuggets': 'raw_iron_nugget raw_gold_nugget raw_copper_nugget coal_lump',
    'bone-gear': 'bone_sword bone_pickaxe bone_axe bone_shovel bone_hoe bone_helmet bone_chestplate bone_leggings bone_boots',
    'meat-gear': 'meat_sword meat_pickaxe meat_axe meat_shovel meat_hoe meat_trim unactive_meat_trim',
    'knives': 'flint_knife copper_knife iron_knife golden_knife diamond_knife netherite_knife',
    'atm': 'atm', 'shops': 'shop',
}.items():
    for i in ids.split():
        PAGE_OF[f'mistraly:{i}'] = slug

GROUPS = [
    ('Валюта и мист', 'mist', 'mist mist_shard raw_mist raw_mist_shard mist_ore deepslate_mist_ore'),
    ('Драгоценные камни', 'gems', 'rough_diamond rough_diamond_shard diamond_shard rough_emerald rough_emerald_shard '
     'emerald_shard rough_lazurite rough_lazurite_shard lapis_lazuli_shard'),
    ('Самородки и уголь', 'nuggets', 'raw_iron_nugget raw_gold_nugget raw_copper_nugget coal_lump'),
    ('Костяное снаряжение', 'bone-gear', 'bone_sword bone_pickaxe bone_axe bone_shovel bone_hoe bone_helmet '
     'bone_chestplate bone_leggings bone_boots'),
    ('Мясное снаряжение', 'meat-gear', 'unactive_meat_trim meat_trim meat_sword meat_pickaxe meat_axe meat_shovel meat_hoe'),
    ('Ножи', 'knives', 'flint_knife copper_knife iron_knife golden_knife diamond_knife netherite_knife'),
    ('Блоки', 'atm', 'atm shop'),
]

def inline(text):
    """§-разметку игры в разметку вики."""
    text = re.sub(r'§[0-9a-f](.*?)§r', r'==\1==', text.replace('%%', '%'))
    return re.sub(r'(^|\s)!(?=\w)', r'\1\\!', text)


def to_markup(text):
    out, in_table = [], False
    for raw in text.replace('\r', '').split('\n'):
        line = raw.strip()
        table = line.startswith('T ')
        if in_table and not table:
            out.append('')
        in_table = table
        if not line:
            continue
        if line.startswith('# '):
            out += ['', line, '']
        elif line.startswith('• '):
            out.append('- ' + inline(line[2:]))
        elif line.startswith('> '):
            out += ['', '> ' + inline(line[2:]), '']
        elif line.startswith('@ '):
            out += ['', f'<flow/{line[2:]}>', '']
        elif line.startswith('R '):
            out.append(f'<recipes/{line[2:].strip()}>')
        elif line.startswith('I '):
            out.append(f'<items/{line[2:].strip()}>')
        elif table:
            out.append('| ' + line[2:].strip() + ' |')
        else:
            out += ['', inline(line), '']
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).strip()


def game(key):
    return lang[f'mistraly.wiki.{key}.text']


def strip_lines(text, *needles):
    return '\n'.join(l for l in text.split('\n') if not any(n in l for n in needles))


GRIND = '''# Что обрабатывается
T Предмет | Результат | Бонус в зелёной зоне
T Неогранённый алмаз | Алмаз | Осколок алмаза
T Неогранённый осколок алмаза | Осколок алмаза | Осколок алмаза
T Неогранённый изумруд | Изумруд | Осколок изумруда
T Неогранённый осколок изумруда | Осколок изумруда | Осколок изумруда
T Необработанный лазурит | Лазурит ×4 | Осколок лазурита
T Осколок необработанного лазурита | Осколок лазурита | Осколок лазурита
T Сырой мист | Мист | Осколок миста
T Сырой осколок миста | Осколок миста | Осколок миста
T Кусок угля | Уголь | Ещё один уголь
'''

PAGES = [
    # Основы
    dict(slug='start', title='С чего начать', cat='Основы', icon='mistraly:mist',
         lead='Короткая справка для новичка: где искать меню сервера и что в Mistraly устроено не так, как в обычной ванилле.',
         info=[('Раздел', 'Основы'), ('Читать', 'за минуту')], see=['chat', 'bank', 'ores', 'death'],
         text=game('start').replace('эта справка', 'справка прямо в игре')),
    dict(slug='chat', title='Чат', cat='Основы', icon=None,
         lead='Чат на сервере разделён: обычные сообщения слышно только поблизости, а для всего сервера есть отдельный префикс.',
         info=[('Радиус', '250 блоков'), ('Глобальный чат', 'сообщение с !'), ('Личные сообщения', '/msg, /tell, /w, /r')],
         see=['commands', 'settings'], text=game('chat')),
    dict(slug='commands', title='Команды', cat='Основы', icon=None,
         lead='Команды, которые доступны всем игрокам. Всё остальное делается через кнопки над инвентарём.',
         info=[('Раздел', 'Основы')], see=['chat', 'settings'],
         text='''# Сообщения
T Команда | Что делает
T /msg ник текст | Личное сообщение игроку
T /tell ник текст | То же, что /msg
T /w ник текст | То же, что /msg
T /r текст | Ответ тому, кто написал последним
# Клавиши
T Клавиша | Что делает
T R на предмете | Показывает рецепт
T U на предмете | Показывает, где используется предмет
T L | Открывает меню достижений
T Shift+ПКМ по игроку | Открывает его профиль
'''),
    dict(slug='punishments', title='Система наказаний', cat='Основы', icon=None,
         lead='За нарушение правил администрация выдаёт предупреждения, мьюты и баны. Предупреждения копятся, и третье подряд приводит к бану.',
         info=[('Варн держится', '1 месяц'), ('3 варна', 'бан на неделю'), ('После бана', 'варны сбрасываются')],
         see=['fines', 'chat'],
         text='''# Варны
Варн — это предупреждение за нарушение правил.
• Варн держится §b1 месяц§r, потом снимается сам.
• §c3 варна§r — бан на неделю.
• После бана варны сбрасываются.
# Другие наказания
T Наказание | Что значит
T Варн | Предупреждение, держится 1 месяц
T Мьют | Запрет писать в чат
T Штраф | Оплата мистами в Банке
T Бан | Запрет заходить на сервер
Какое наказание выдать и на какой срок, решает администрация. Список нарушений есть в [правилах](/rules).
> Не согласны с наказанием? Откройте тикет в Discord.
'''),
    dict(slug='settings', title='Настройки', cat='Основы', icon=None,
         lead='Настройки открываются кнопкой над инвентарём. Здесь выбирают, какие уведомления получать и кто может писать в личные сообщения.',
         info=[('Как открыть', 'кнопка над инвентарём')], see=['chat', 'bank'], text=game('settings')),
    # Экономика
    dict(slug='bank', title='Банк и счета', cat='Экономика', icon='mistraly:mist',
         lead='Банк — основа экономики сервера. Деньги здесь называются мистами и хранятся на счетах, а кнопка «Банк» над инвентарём открывает их откуда угодно.',
         info=[('Валюта', 'мист'), ('Счетов', '2, с Plus 4'), ('Как открыть', 'кнопка над инвентарём')],
         see=['atm', 'transfers', 'co-owners', 'fines', 'shops'],
         text=strip_lines(game('bank'), 'в подразделах слева')),
    dict(slug='atm', title='Банкомат', cat='Экономика', icon='mistraly:atm',
         lead='Банкомат — блок, через который мисты попадают на счёт и обратно. Только здесь можно открыть новый счёт.',
         info=[('Тип', 'блок'), ('Снятие за раз', 'до 1728 мистов'), ('Осколки', '9 = 1 мист')],
         see=['bank', 'mist'], text=game('atm')),
    dict(slug='transfers', title='Переводы', cat='Экономика', icon=None,
         lead='Мисты можно отправить любому игроку со счёта на счёт, для этого не нужно стоять рядом с банкоматом.',
         info=[('Комментарий', 'необязательно')], see=['bank', 'profile'], text=game('transfers')),
    dict(slug='co-owners', title='Совладельцы', cat='Экономика', icon=None,
         lead='К счёту можно пригласить других игроков и пользоваться им вместе, например, вести общую казну поселения.',
         info=[('Максимум', '4 игрока'), ('Приглашение', 'через историю счёта')], see=['bank', 'settings'],
         text=game('co_owners')),
    dict(slug='fines', title='Штрафы', cat='Экономика', icon=None,
         lead='Штраф выписывает администрация за нарушения. Его видно в Банке, а просрочка ведёт к предупреждениям и бану.',
         info=[('Просрочка', 'предупреждение в неделю'), ('3 предупреждения', 'бан на неделю')],
         see=['bank'], text=game('fines')),
    dict(slug='shops', title='Магазины и рынок', cat='Экономика', icon='mistraly:shop',
         lead='Магазин — блок, через который игрок продаёт предметы за мисты без личного присутствия. Все магазины сервера видно на рынке.',
         info=[('Тип', 'блок'), ('Слотов', '4'), ('Новый слот', '100 мистов')], see=['bank', 'mist'], text=game('shops')),
    # Игрок
    dict(slug='profile', title='Профиль игрока', cat='Игрок', icon=None,
         lead='Профиль показывает снаряжение, статистику, счета и магазины игрока. Открывается нажатием Shift+ПКМ по нему.',
         info=[('Как открыть', 'Shift+ПКМ по игроку')], see=['cabinet', 'transfers'],
         text=game('profile').replace('в подразделе «Личный кабинет»', 'настраивается в Личном кабинете')),
    dict(slug='cabinet', title='Личный кабинет', cat='Игрок', icon=None,
         lead='В Личном кабинете выбирают тему ника и решают, что другие увидят в вашем профиле.',
         info=[('Как открыть', 'кнопка над инвентарём'), ('Темы', 'Обычная, Plus, Админ, Глитч')],
         see=['profile', 'plus'], text=game('cabinet')),
    dict(slug='plus', title='Подписка Plus', cat='Игрок', icon=None,
         lead='Plus — подписка с дополнительными счетами и золотым оформлением. Выдаёт её администрация.',
         info=[('Счетов', '4 вместо 2'), ('Выдаёт', 'администрация')], see=['bank', 'cabinet'], text=game('plus')),
    dict(slug='achievements', title='Достижения', cat='Игрок', icon=None,
         lead='Ванильные достижения на сервере заменены своими целями сервера.',
         info=[('Как открыть', 'кнопка с кубком или L'), ('Всего', '3')], see=['bank', 'shops'],
         text=game('achievements') + '''
# Список достижений
T Название | Что сделать
T Ебанк | Открыть счёт в банке
T Молодой миллионер | Заработать 999 999 мистов
T Темщик | Поставить 8 магазинов
'''),
    dict(slug='death', title='Смерть и могилы', cat='Игрок', icon=None,
         lead='Смерть на сервере не отбирает всё сразу: часть вещей остаётся у игрока, а остальное ждёт в могиле.',
         info=[('Потеря прочности', '10%'), ('Могила лежит', '12 часов'), ('Слотов артефактов', '4')],
         see=['profile'], text=game('death')),
    # Добыча
    dict(slug='ores', title='Руды и точило', cat='Добыча', icon='mistraly:rough_diamond',
         lead='Руды дают не готовые ресурсы, а грубые камни, самородки и осколки. Камни доводят на точиле в небольшой мини-игре.',
         info=[('Инструмент', 'точило'), ('Управление', 'пробел или ЛКМ'), ('Бонус', 'зелёная зона')],
         see=['mist', 'gems', 'nuggets'],
         text=strip_lines(game('ores'), 'U mistraly:rough_diamond').replace('# Точило\n', '# Точило\n') + '\n' + GRIND),
    dict(slug='mist', title='Мист', cat='Добыча', icon='mistraly:mist',
         lead='Мист — валюта сервера. Его добывают из мистовой руды, доводят на точиле и кладут на счёт через банкомат.',
         info=[('Тип', 'валюта'), ('Руда', 'глубоко под землёй'), ('Делится на', '9 осколков')], see=['bank', 'atm', 'ores'],
         text='''# Предметы
I mistraly:mist_ore mistraly:deepslate_mist_ore mistraly:raw_mist mistraly:raw_mist_shard mistraly:mist mistraly:mist_shard
# Как получить
@ mistraly:mist_ore > mistraly:raw_mist + mistraly:raw_mist_shard
Мистовая руда залегает глубоко, ближе к бедроку, как алмазы. Сырой мист доводят на точиле.
@ mistraly:raw_mist > mistraly:mist + mistraly:mist_shard
• Удача повышает шанс сырого осколка.
• Попадание в зелёную зону на точиле даёт бонусный осколок миста.
> Руду, добытую с шёлковым касанием, можно переплавить в сырой мист.
# Рецепты
R mistraly:mist
R mistraly:mist_shard
R mistraly:raw_mist
R mistraly:raw_mist_shard
'''),
    dict(slug='gems', title='Драгоценные камни', cat='Добыча', icon='mistraly:rough_diamond',
         lead='Алмаз, изумруд и лазурит выпадают из руды неогранёнными. Готовый камень получают только на точиле.',
         info=[('Камни', 'алмаз, изумруд, лазурит'), ('Обработка', 'точило')], see=['ores', 'mist'],
         text='''# Предметы
I mistraly:rough_diamond mistraly:rough_diamond_shard mistraly:diamond_shard
I mistraly:rough_emerald mistraly:rough_emerald_shard mistraly:emerald_shard
I mistraly:rough_lazurite mistraly:rough_lazurite_shard mistraly:lapis_lazuli_shard
# Как получить
@ minecraft:diamond_ore > mistraly:rough_diamond + mistraly:rough_diamond_shard
Изумруд и лазурит добываются так же. Удача повышает шанс грубого осколка.
• 9 осколков складываются в алмаз или изумруд.
• 4 осколка складываются в лазурит.
# Рецепты
R minecraft:diamond
R minecraft:emerald
R minecraft:lapis_lazuli
R mistraly:rough_diamond_shard
R mistraly:rough_emerald_shard
R mistraly:rough_lazurite_shard
'''),
    dict(slug='nuggets', title='Самородки и уголь', cat='Добыча', icon='mistraly:raw_iron_nugget',
         lead='Железная, золотая и медная руды дают самородки сырого металла, а угольная — куски угля.',
         info=[('Металлы', 'железо, золото, медь'), ('Из руды', 'по 6 самородков')], see=['ores'],
         text='''# Предметы
I mistraly:raw_iron_nugget mistraly:raw_gold_nugget mistraly:raw_copper_nugget mistraly:coal_lump
# Как получить
@ minecraft:iron_ore > mistraly:raw_iron_nugget*6
@ minecraft:coal_ore > mistraly:coal_lump
• 9 самородков складываются в сырой металл.
• Самородок сырого металла переплавляется в обычный самородок.
• Кусок угля годится как топливо, а на точиле превращается в уголь.
# Рецепты
R minecraft:raw_iron
R minecraft:raw_gold
R minecraft:raw_copper
R minecraft:iron_nugget
R minecraft:gold_nugget
R minecraft:copper_nugget
'''),
    # Снаряжение
    dict(slug='bone-gear', title='Костяное снаряжение', cat='Снаряжение', icon='mistraly:bone_sword',
         lead='Дешёвое снаряжение из костей: быстро копает и хорошо бьёт, но недолговечно. Полный комплект брони возвращает часть урона.',
         info=[('Материал', 'кость'), ('Прочность инструмента', '100'), ('Улучшается до', 'мясного')],
         see=['meat-gear', 'knives'],
         text='''# Инструменты
I mistraly:bone_sword mistraly:bone_pickaxe mistraly:bone_axe mistraly:bone_shovel mistraly:bone_hoe
T Предмет | Урон | Скорость атаки | Прочность
T Костяной меч | 6,5 | 1,6 | 100
T Костяная кирка | 4,5 | 1,2 | 100
T Костяной топор | 9 | 1 | 100
T Костяная лопата | 5 | 1 | 100
T Костяная мотыга | 1 | 3,5 | 100
Копают на уровне железа: всё, что доступно железной кирке.
# Броня
I mistraly:bone_helmet mistraly:bone_chestplate mistraly:bone_leggings mistraly:bone_boots
T Предмет | Защита | Прочность
T Костяной шлем | 2 | 88
T Костяной нагрудник | 6 | 128
T Костяные поножи | 5 | 120
T Костяные ботинки | 2 | 104
• Полный комплект: 30% полученного урона возвращается тому, кто его нанёс.
• Нельзя зачаровать на «Шипы».
# Рецепты
R mistraly:bone_sword
R mistraly:bone_pickaxe
R mistraly:bone_helmet
R mistraly:bone_chestplate
'''),
    dict(slug='meat-gear', title='Мясное снаряжение', cat='Снаряжение', icon='mistraly:meat_sword',
         lead='Живые инструменты, улучшенные из костяных. Они не ломаются окончательно и питаются едой вместо ремонта.',
         info=[('Материал', 'мясное улучшение'), ('Уровень добычи', 'незерит'), ('Ремонт', 'кормление едой')],
         see=['bone-gear', 'knives'],
         text='''# Мясное улучшение
@ mistraly:unactive_meat_trim > mistraly:meat_trim
• Покормите неактивное улучшение пятью разными продуктами по очереди.
• Оно просит конкретный продукт, после пятой кормёжки становится мясным улучшением.
• На кузнечном столе улучшение превращает костяной инструмент в мясной.
R mistraly:unactive_meat_trim
# Инструменты
I mistraly:meat_sword mistraly:meat_pickaxe mistraly:meat_axe mistraly:meat_shovel mistraly:meat_hoe
T Предмет | Урон | Скорость атаки | Прочность
T Мясной меч | 8 | 1,6 | 100
T Мясная кирка | 6 | 1,2 | 100
T Мясной топор | 10 | 1 | 100
T Мясная лопата | 6,5 | 1 | 100
T Мясная мотыга | 1 | 4 | 100
# Особенности
• ПКМ едой по инструменту кормит его и восполняет прочность.
• На последней единице прочности инструмент не ломается, а перестаёт работать, пока его не покормят.
• Зачарование «Прочность» недоступно.
# Ускорение
T Еда | Ускорение добычи | Скорость атаки | Длительность
T Золотое яблоко | ×1,5 | +50% | 1 минута
T Зачарованное золотое яблоко | ×2 | +100% | 5 минут
# Рецепты
R mistraly:meat_sword
R mistraly:meat_pickaxe
'''),
    dict(slug='knives', title='Ножи', cat='Снаряжение', icon='mistraly:iron_knife',
         lead='Лёгкое оружие: бьёт слабее меча, зато заметно быстрее. Первый нож можно сделать уже из кремня.',
         info=[('Скорость атаки', '2,2'), ('Материалы', '6')], see=['bone-gear', 'meat-gear'],
         text='''# Виды ножей
I mistraly:flint_knife mistraly:copper_knife mistraly:iron_knife mistraly:golden_knife mistraly:diamond_knife mistraly:netherite_knife
T Предмет | Урон | Скорость атаки | Прочность
T Кремнёвый нож | 4 | 2,2 | 131
T Медный нож | 4 | 2,2 | 190
T Железный нож | 5 | 2,2 | 250
T Золотой нож | 3 | 2,2 | 32
T Алмазный нож | 6 | 2,2 | 1561
T Незеритовый нож | 7 | 2,2 | 2031
# Рецепты
R mistraly:flint_knife
R mistraly:iron_knife
R mistraly:netherite_knife
'''),
]

CATS = ['Основы', 'Экономика', 'Игрок', 'Добыча', 'Снаряжение']
CAT_TEXT = {
    'Основы': 'Первые шаги, чат, команды и настройки.',
    'Экономика': 'Мисты, счета, переводы, магазины и штрафы.',
    'Игрок': 'Профиль, темы ника, достижения и смерть.',
    'Добыча': 'Руды, точило, камни и валюта сервера.',
    'Снаряжение': 'Костяные и мясные инструменты, броня и ножи.',
}

FORMATTING = open('scripts/wiki-formatting.md', encoding='utf-8').read().strip()

pages = []
for p in PAGES:
    head = []
    if p['icon']:
        head.append(f"<icon/{p['icon']}>")
    head += [f'<info/{k}/{v}>' for k, v in p['info']]
    source = '\n'.join(head) + '\n\n' + p['lead'] + '\n\n' + to_markup(p['text'])
    if p['see']:
        source += '\n\n<see/' + ' '.join(p['see']) + '>'
    pages.append({'slug': p['slug'], 'title': p['title'], 'cat': p['cat'], 'source': source})
pages.append({'slug': 'formatting', 'title': 'Форматирование и разметка', 'cat': 'Основы', 'source': FORMATTING})

known = {p['slug'] for p in pages}
for p in PAGES:
    missing = [s for s in p['see'] if s not in known]
    assert not missing, (p['slug'], missing)

items = {i: {'name': name(i), 'icon': icons.get(i), 'page': PAGE_OF.get(i)}
         for i in set(VANILLA) | set(icons)}
for rs in recipes.values():
    for r in rs:
        for x in r['slots'] + [r['result']['id']]:
            if x and x not in items:
                items[x] = {'name': name(x), 'icon': icons.get(x), 'page': PAGE_OF.get(x)}

groups = [{'title': t, 'page': s, 'items': [f'mistraly:{i}' for i in ids.split()]} for t, s, ids in GROUPS]

data = {'pages': pages, 'cats': [{'name': c, 'text': CAT_TEXT[c]} for c in CATS],
        'groups': groups, 'items': items, 'recipes': recipes}
json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
# Базовые статьи для вики в игре: мод забирает их с сайта вместе с правками игроков.
json.dump({'pages': pages}, open('public/wiki-pages.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(pages), 'статей,', len(items), 'предметов,', len(os.listdir(OUT_IMG)), 'картинок')
