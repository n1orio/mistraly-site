#!/usr/bin/env python3
"""Собирает вики сайта из исходников мода Mistraly.

    python3 scripts/gen-wiki.py /home/nio/mistraly-season-2/mistraly

Тексты механик берутся из внутриигровой вики (mistraly.wiki.*.text в ru_ru.json),
названия, рецепты и текстуры — оттуда же, поэтому цифры на сайте совпадают с игрой.
Страницы про предметы написаны здесь в том же формате, что и игровые:
    # заголовок        • пункт списка        > подсказка
    @ a > b*6 + c      цепочка предметов     R id   рецепт    I a b c   ряд предметов
    T шапка | шапка    таблица (строки тоже начинаются с T)
На выходе src/data/wiki-data.json и картинки в public/images/wiki.
"""
import glob
import html
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

items_used = set()


def item(i):
    items_used.add(i)
    return {'id': i, 'name': name(i), 'icon': icons.get(i), 'page': PAGE_OF.get(i)}


# Ссылки в тексте: первое упоминание на странице ведёт на статью о нём.
LINKS = [
    (r'[Бб]анкомат\w*', 'atm'), (r'[Сс]овладельц\w*', 'co-owners'), (r'[Шш]траф\w*', 'fines'),
    (r'[Мм]агазин\w*', 'shops'), (r'[Рр]ын[оа]к\w*', 'shops'), (r'[Мм]огил\w*', 'death'),
    (r'[Тт]очил\w*', 'ores'), (r'[Лл]ичн\w+ кабинет\w*', 'cabinet'), (r'[Нн]астройк\w*', 'settings'),
    (r'[Пп]ерево[дв]\w*', 'transfers'), (r'\bPlus\b', 'plus'), (r'[Мм]ист\w*', 'mist'), (r'[Пп]рофил\w*', 'profile'),
    (r'[Дд]остижени\w*', 'achievements'), (r'[Аа]ртефакт\w*', 'death'),
]
COLORS = {'b': 'hl', '6': 'gold', 'c': 'bad', 'a': 'good', '9': 'hl', 'f': 'plain'}


def inline(text, seen, own):
    """§-разметку игры в HTML. Текст экранируется, ссылки только на свои статьи."""
    out, cls = [], None
    for chunk in re.split(r'(§.)', text.replace('%%', '%')):
        if chunk.startswith('§'):
            c = chunk[1]
            cls = None if c == 'r' else COLORS.get(c)
            continue
        if not chunk:
            continue
        piece = html.escape(chunk)
        for pat, slug in LINKS:
            if slug == own or slug in seen:
                continue
            m = re.search(rf'(?<![\w/"=]){pat}', piece)
            if m:
                seen.add(slug)
                piece = f'{piece[:m.start()]}<a href="/wiki/{slug}" data-wiki>{m.group(0)}</a>{piece[m.end():]}'
                break
        out.append(f'<span class="w-{cls}">{piece}</span>' if cls else piece)
    return ''.join(out)


def flow_step(s):
    s = s.strip()
    count = 1
    if '*' in s:
        s, c = s.split('*')
        count = int(c)
    return {**item(s), 'count': count}


def parse(text, own):
    blocks, seen, used = [], set(), {}
    for raw in text.replace('\r', '').split('\n'):
        line = raw.strip()
        if not line:
            continue
        if line.startswith('# '):
            title = line[2:]
            sid = f's{len([b for b in blocks if b["t"] == "h"]) + 1}'
            blocks.append({'t': 'h', 'text': title, 'id': sid})
        elif line.startswith('• '):
            if not blocks or blocks[-1]['t'] != 'ul':
                blocks.append({'t': 'ul', 'items': []})
            blocks[-1]['items'].append(inline(line[2:], seen, own))
        elif line.startswith('> '):
            blocks.append({'t': 'tip', 'html': inline(line[2:], seen, own)})
        elif line.startswith('@ '):
            stages = [[flow_step(x) for x in part.split('+')] for part in line[2:].split('>')]
            blocks.append({'t': 'flow', 'stages': stages})
        elif line.startswith('R '):
            rid = line[2:].strip()
            for r in recipes.get(rid, []):
                if id(r) in used:
                    continue
                used[id(r)] = True
                blocks.append({'t': 'recipe', 'kind': r['kind'],
                               'slots': [item(x) if x else None for x in r['slots']],
                               'result': {**item(r['result']['id']), 'count': r['result']['count']}})
        elif line.startswith('I '):
            blocks.append({'t': 'items', 'items': [item(x) for x in line[2:].split()]})
        elif line.startswith('T '):
            row = [c.strip() for c in line[2:].split('|')]
            if not blocks or blocks[-1]['t'] != 'table':
                blocks.append({'t': 'table', 'head': row, 'rows': []})
            else:
                blocks[-1]['rows'].append(row)
        else:
            blocks.append({'t': 'p', 'html': inline(line, seen, own)})
    return blocks


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
         lead='Ванильные достижения на сервере заменены своими целями сезона.',
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

pages = []
for p in PAGES:
    blocks = parse(p['text'], p['slug'])
    plain = re.sub(r'<[^>]+>', ' ', ' '.join(
        b.get('text') or b.get('html') or ' '.join(b.get('items', []) if b['t'] == 'ul' else []) for b in blocks))
    pages.append({
        'slug': p['slug'], 'title': p['title'], 'cat': p['cat'],
        'icon': icons.get(p['icon']) if p['icon'] else None,
        'lead': p['lead'], 'info': p['info'], 'see': p['see'], 'blocks': blocks,
        'search': f"{p['title']} {p['lead']} {plain}".lower(),
    })
titles = {p['slug'] for p in pages}
for p in pages:
    missing = [s for s in p['see'] if s not in titles]
    assert not missing, (p['slug'], missing)

groups = [{'title': t, 'page': s, 'items': [item(f'mistraly:{i}') for i in ids.split()]} for t, s, ids in GROUPS]

data = {'pages': pages, 'cats': [{'name': c, 'text': CAT_TEXT[c]} for c in CATS], 'groups': groups}
json.dump(data, open(OUT_JSON, 'w'), ensure_ascii=False, indent=0)
print(len(pages), 'статей,', len(os.listdir(OUT_IMG)), 'картинок')
